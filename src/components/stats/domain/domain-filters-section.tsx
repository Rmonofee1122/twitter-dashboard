"use client";

import { memo } from "react";
import DateFilter from "@/components/accounts/date-filter";
import DomainFilter from "@/components/stats/domain/domain-filter";

interface DomainFiltersSectionProps {
  startDate: string;
  endDate: string;
  selectedDomains: string[];
  availableDomains: string[];
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onQuickSelect: (start: string, end: string) => void;
  onClearDateFilter: () => void;
  onDomainChange: (domains: string[]) => void;
  onClearDomainFilter: () => void;
}

const DomainFiltersSection = memo(function DomainFiltersSection({
  startDate,
  endDate,
  selectedDomains,
  availableDomains,
  onStartDateChange,
  onEndDateChange,
  onQuickSelect,
  onClearDateFilter,
  onDomainChange,
  onClearDomainFilter,
}: DomainFiltersSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DateFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onQuickSelect={onQuickSelect}
        onClear={onClearDateFilter}
      />

      {availableDomains.length > 0 && (
        <DomainFilter
          availableDomains={availableDomains}
          selectedDomains={selectedDomains}
          onDomainChange={onDomainChange}
          onClear={onClearDomainFilter}
        />
      )}
    </div>
  );
});

export default DomainFiltersSection;