export const ProductMediaTypes = {
  MainImage: 'main_image',
  GalleryImage: 'gallery_image',
  DetailImage: 'detail_image',
  Video: 'video'
} as const;

export type ProductMediaType = (typeof ProductMediaTypes)[keyof typeof ProductMediaTypes];

export const ProductMediaTypeCatalog: Array<{ code: ProductMediaType; name: string }> = [
  { code: ProductMediaTypes.MainImage, name: '主图' },
  { code: ProductMediaTypes.GalleryImage, name: '轮播图' },
  { code: ProductMediaTypes.DetailImage, name: '详情图' },
  { code: ProductMediaTypes.Video, name: '视频' }
];
