import { motion } from 'motion/react';
import { Layers } from 'lucide-react';
import type { MarketplaceCategory } from '@/types';

interface CategoriesProps {
  categories: MarketplaceCategory[];
  onSelectCategory: (serviceName: string) => void;
  activeCategory: string | null;
}

export default function Categories({ categories, onSelectCategory, activeCategory }: CategoriesProps) {
  return (
    <section id="categories" className="py-20 bg-white border-t border-b border-gray-150 scroll-mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
          <div>
            <div className="inline-flex items-center gap-1 bg-[#D32323]/10 text-[#D32323] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5" /> Especialidades
            </div>
            <h2 className="text-3xl font-black text-[#333] tracking-tight">
              Explora servicios por categoría
            </h2>
            <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">
              Haz clic en una ficha para filtrar las agencias locales que dominan esa área.
            </p>
          </div>
          {activeCategory && (
            <button
              onClick={() => onSelectCategory('')}
              className="mt-4 md:mt-0 text-xs font-bold text-[#D32323] hover:underline cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-xs"
            >
              Restablecer Filtro x
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const triggerName = category.queryName || category.name;
            const isSelected = activeCategory === triggerName || activeCategory === category.name;

            return (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
                onClick={() => onSelectCategory(triggerName)}
                className={`group relative min-h-52 rounded-2xl overflow-hidden cursor-pointer shadow-md border-2 transition-all bg-[#111827] ${
                  isSelected ? 'border-[#D32323] ring-4 ring-red-100 shadow-lg' : 'border-transparent'
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(211,35,35,0.24),transparent_34%),linear-gradient(180deg,#16202f,#111827)] group-hover:opacity-95 transition-all" />

                <div className="relative h-full p-5 flex flex-col justify-between">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/80 border border-white/10">
                    <Layers className="w-3.5 h-3.5" /> {category.iconName || 'Categoría'}
                  </div>

                  <div className="flex justify-between items-end gap-4">
                    <div className="mr-4">
                      <span className="text-xs uppercase font-extrabold text-[#ff8181] tracking-wider block mb-1">
                        SEO LOCAL
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-md">
                        {category.name}
                      </h3>
                      <p className="mt-3 text-xs text-white/70 font-medium leading-relaxed line-clamp-3 max-w-sm">
                        {category.description}
                      </p>
                    </div>

                    <span className="shrink-0 bg-white text-[#D32323] px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider shadow-md opacity-95 group-hover:bg-[#D32323] group-hover:text-white transition-all duration-300">
                      {category.servicesCount} servicios
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
