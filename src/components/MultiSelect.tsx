import { useState, useRef, useEffect, MouseEvent } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export const MultiSelect = ({ options, value, onChange, placeholder = 'Pilih...' }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const removeOption = (e: MouseEvent, optValue: string) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optValue));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`w-full min-h-[42px] px-2 py-1.5 border rounded-lg flex flex-wrap items-center gap-1.5 cursor-pointer bg-white ${isOpen ? 'border-[#0B2D72] ring-2 ring-[#0B2D72]/20' : 'border-gray-300'}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
      >
        {value.length > 0 ? (
          value.map(val => {
            const opt = options.find(o => o.value === val);
            if (!opt) return null;
            return (
              <span key={val} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-[#0B2D72] text-xs font-medium rounded-md">
                {opt.label}
                <X 
                  size={14} 
                  className="cursor-pointer hover:text-red-500" 
                  onClick={(e) => removeOption(e, val)}
                />
              </span>
            );
          })
        ) : (
          <span className="text-gray-500 px-1">{placeholder}</span>
        )}
        <div className="ml-auto pl-1">
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0B2D72]"
                placeholder="Cari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => {
                const isSelected = value.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    className={`px-3 py-2 text-sm rounded-md cursor-pointer flex items-center space-x-2 hover:bg-blue-50 ${isSelected ? 'bg-blue-50/50' : 'text-gray-700'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(opt.value);
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      readOnly
                      className="rounded text-[#0B2D72] focus:ring-[#0B2D72] w-4 h-4 pointer-events-none"
                    />
                    <span className={isSelected ? 'font-medium text-[#0B2D72]' : ''}>{opt.label}</span>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-sm text-center text-gray-500">
                Tidak ada hasil ditemukan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
