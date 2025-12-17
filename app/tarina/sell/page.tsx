'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Plus } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleContext';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function SellPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: 'OTHER',
    description: '',
  });

  const categories = [
    { id: 'CLOTHING', label: t('clothing') },
    { id: 'FURNITURE', label: t('furniture') },
    { id: 'ELECTRONICS', label: t('electronics') },
    { id: 'BOOKS', label: t('books') },
    { id: 'ART', label: t('art') },
    { id: 'OTHER', label: t('other') },
  ];

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const remainingSlots = 5 - imagePreviews.length;
      const filesToProcess = fileArray.slice(0, remainingSlots);

      const readFilePromises = filesToProcess.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      const newPreviews = await Promise.all(readFilePromises);
      setImagePreviews([...imagePreviews, ...newPreviews]);
      setImageFiles([...imageFiles, ...filesToProcess]);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const uploadedImageUrls: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        uploadedImageUrls.push(publicUrl);
      }

      const { data, error } = await supabase
        .from('orus_products')
        .insert([
          {
            seller_id: user.id,
            title: formData.title,
            price: parseFloat(formData.price),
            category: formData.category,
            description: formData.description,
            images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
            image_url: uploadedImageUrls[0] || 'https://via.placeholder.com/400',
            status_moderation: 'APPROVED',
            status_logistique: 'CONTROLE_OK',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      router.push('/tarina/profile');
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-tarina-brown dark:text-tarina-amber mb-6">
        {t('sellAnItem')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
            Photos ({imagePreviews.length}/5)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            ))}

            {imagePreviews.length < 5 && (
              <label
                htmlFor="image-upload"
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-tarina-amber hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors flex flex-col items-center justify-center"
              >
                <Plus className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Add Photo</span>
              </label>
            )}
          </div>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            {t('title')}
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Vintage Lamp..."
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              {t('priceEuro')}
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
              {t('category')}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            {t('description')}
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('descriptionPlaceholder')}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-tarina-amber focus:border-transparent transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-tarina-amber hover:bg-tarina-amber-dark text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-lg"
        >
          {loading ? t('loading') : t('listItem')}
        </button>
      </form>
    </div>
  );
}
