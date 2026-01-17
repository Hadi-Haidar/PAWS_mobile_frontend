import { supabase } from '../lib/supabase';

/**
 * Uploads an image to Supabase Storage and returns the public URL.
 * @param {string} uri - The local file URI of the image.
 * @returns {Promise<string|null>} - The public URL of the uploaded image.
 */
export const uploadImage = async (uri) => {
    try {
        if (!uri) return null;
        if (uri.startsWith('http')) return uri; // Already uploaded

        const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpeg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Fetch file as ArrayBuffer for robust React Native upload
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();

        const { error: uploadError } = await supabase.storage
            .from('paws_images')
            .upload(filePath, arrayBuffer, {
                contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                upsert: false,
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('paws_images')
            .getPublicUrl(filePath);

        if (!data || !data.publicUrl) {
            throw new Error('Failed to get public URL');
        }

        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload image. Please try again.');
    }
};
