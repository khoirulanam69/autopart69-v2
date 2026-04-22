const DEFAULT_PRODUCT_IMAGE_CDN_URL = 'https://cdn.mkaindo.com/autopart-products';

export const PRODUCT_IMAGE_CDN_URL = (
  import.meta.env.VITE_PRODUCT_IMAGE_CDN_URL || DEFAULT_PRODUCT_IMAGE_CDN_URL
).replace(/\/+$/, '');

const isBrowserImageUrl = (value: string) => /^(data|blob):/i.test(value);
const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

export const getProductImageUrl = (imageUrl?: string | null): string | null => {
  const value = imageUrl?.trim();
  if (!value) return null;
  if (isBrowserImageUrl(value)) return value;
  if (isHttpUrl(value)) return value;

  const filename = value.replace(/^\/+/, '');
  const encodedFilename = filename.split('/').map(encodeURIComponent).join('/');
  return `${PRODUCT_IMAGE_CDN_URL}/${encodedFilename}`;
};

export const getProductImageFilename = (imageUrl?: string | null): string | null => {
  const value = imageUrl?.trim();
  if (!value) return null;

  const cdnPrefix = `${PRODUCT_IMAGE_CDN_URL}/`;
  if (value.startsWith(cdnPrefix)) {
    return decodeURIComponent(value.slice(cdnPrefix.length));
  }

  return value.replace(/^\/+/, '');
};