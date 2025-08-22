"use client";

import { useEffect, useState, useCallback } from "react";
import { Image as ImageIcon, RefreshCw } from "lucide-react";
import ImageStatsSummary from "@/components/images/image-stats-summary";
import ImageGrid from "@/components/images/image-grid";
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

export default function ImagesPage() {
  const [imageData, setImageData] = useState<ImageListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGeneratedModalOpen, setIsGeneratedModalOpen] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/images");
      const data = await response.json();
      setImageData(data);
    } catch (error) {
      console.error("画像データの取得に失敗しました:", error);
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
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleImageGenerated = useCallback((imageUrl: string, prompt: string) => {
    setGeneratedImageUrl(imageUrl);
    setGeneratedPrompt(prompt);
    setIsGeneratedModalOpen(true);
  }, []);

  const handleCloseGeneratedModal = useCallback(() => {
    setIsGeneratedModalOpen(false);
    setGeneratedImageUrl(null);
    setGeneratedPrompt("");
  }, []);

  const handleSaveGeneratedImage = useCallback(async (imageUrl: string, prompt: string) => {
    try {
      // Base64画像をBlobに変換
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // FormDataを作成
      const formData = new FormData();
      const fileName = `gemini_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      formData.append('file', file);

      // アップロードAPI呼び出し
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        alert('画像をギャラリーに保存しました');
        handleCloseGeneratedModal();
        fetchImages(); // 画像一覧を更新
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('画像の保存に失敗しました');
    }
  }, [handleCloseGeneratedModal, fetchImages]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">画像データを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ImageIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">画像一覧</h1>
        </div>
        <button
          onClick={fetchImages}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
      <ImageGrid 
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