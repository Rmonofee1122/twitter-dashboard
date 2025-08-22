"use client";

import { useEffect, useState, useCallback } from "react";
import { Image as ImageIcon, RefreshCw, Cloud } from "lucide-react";
import ImageStatsSummary from "@/components/images/image-stats-summary";
import ImageGridR2 from "@/components/images/image-grid-r2";
import ImageDetailModal from "@/components/images/image-detail-modal";
import GeminiImageGenerator from "@/components/images/gemini-image-generator";
import GeneratedImageModal from "@/components/images/generated-image-modal";

interface ImageFile {
  name: string;
  url: string;
  size: number;
  lastModified: string;
}

interface ImageListData {
  images: ImageFile[];
  total: number;
}

export const dynamic = "force-dynamic"; // 常に最新を取得
type Item = {
  key: string;
  url: string;
  size: number | null;
  lastModified: string | null;
};

export default function ImagesR2Page() {
  const [imageData, setImageData] = useState<ImageListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGeneratedModalOpen, setIsGeneratedModalOpen] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/images-r2");
      const data = await response.json();

      // R2 APIのレスポンス形式をImageFile形式に変換
      const convertedImages: ImageFile[] =
        data.items?.map((item: any) => ({
          name: item.key,
          url: item.url,
          size: item.size || 0,
          lastModified: item.lastModified || new Date().toISOString(),
        })) || [];

      setImageData({
        images: convertedImages,
        total: data.count || 0,
      });
    } catch (error) {
      console.error("R2画像データの取得に失敗しました:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleImageClick = useCallback((image: ImageFile) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedImage(null);
  }, []);

  const handleDownload = useCallback((image: ImageFile) => {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleImageGenerated = useCallback(
    (imageUrl: string, prompt: string) => {
      setGeneratedImageUrl(imageUrl);
      setGeneratedPrompt(prompt);
      setIsGeneratedModalOpen(true);
    },
    []
  );

  const handleCloseGeneratedModal = useCallback(() => {
    setIsGeneratedModalOpen(false);
    setGeneratedImageUrl(null);
    setGeneratedPrompt("");
  }, []);

  const handleSaveGeneratedImage = useCallback(
    async (imageUrl: string, prompt: string) => {
      try {
        // Base64画像をBlobに変換
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // FormDataを作成
        const formData = new FormData();
        const fileName = `gemini_${Date.now()}.png`;
        const file = new File([blob], fileName, { type: "image/png" });
        formData.append("file", file);

        // R2用アップロードAPI呼び出し
        const uploadResponse = await fetch("/api/upload-image-r2", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          alert("画像をR2ギャラリーに保存しました");
          handleCloseGeneratedModal();
          fetchImages(); // 画像一覧を更新
        } else {
          throw new Error("R2への保存に失敗しました");
        }
      } catch (error) {
        console.error("R2保存エラー:", error);
        alert("R2への画像保存に失敗しました");
      }
    },
    [handleCloseGeneratedModal, fetchImages]
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">R2画像データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Cloud className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              画像一覧（Cloudflare R2）
            </h1>
            <p className="text-sm text-gray-600">
              Cloudflare R2バケット「twitterdashboard」からの画像一覧
            </p>
          </div>
        </div>
        <button
          onClick={fetchImages}
          className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          更新
        </button>
      </div>

      {/* Gemini画像生成 */}
      <GeminiImageGenerator onImageGenerated={handleImageGenerated} />

      {/* 統計サマリー */}
      {imageData && imageData.total !== undefined && (
        <ImageStatsSummary total={imageData.total} />
      )}

      {/* 画像一覧 */}
      <ImageGridR2
        images={imageData?.images || []}
        onImageClick={handleImageClick}
        onDownload={handleDownload}
        onUploadSuccess={fetchImages}
      />

      {/* 画像詳細モーダル */}
      <ImageDetailModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDownload={handleDownload}
      />

      {/* 生成画像プレビューモーダル */}
      <GeneratedImageModal
        isOpen={isGeneratedModalOpen}
        imageUrl={generatedImageUrl}
        prompt={generatedPrompt}
        onClose={handleCloseGeneratedModal}
        onSave={handleSaveGeneratedImage}
      />
    </div>
  );
}
