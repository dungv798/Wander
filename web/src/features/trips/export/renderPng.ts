import type { DestinationDetail } from '../../discover/index.ts';
import { HERO_PHOTOS } from '../../discover/index.ts';
import { EXPORT_COPY as C } from './export.copy.ts';
import { PNG } from './export.const.ts';
import { exportBlocks, pngFilename } from './exportModel.ts';
import { fitPages } from './pageFit.ts';
import { wrapText } from './textLayout.ts';
import type { ExportInput, LayoutPage, PngFile, TextRole } from './Export.types.ts';

const FONT_SIZE: Readonly<Record<TextRole, number>> = { title: PNG.titleSize, heading: PNG.headingSize, body: PNG.bodySize, small: PNG.smallSize };

/** Tìm đúng ảnh hero đã tuyển cùng tác giả/giấy phép; không có ghi công thì bỏ ảnh. */
export function heroPhoto(destination: DestinationDetail) {
  const photos = destination.places.flatMap(p => p.photos);
  for (const file of HERO_PHOTOS[destination.id] ?? []) {
    const photo = photos.find(p => p.url.endsWith(`/${file}`) && p.author && p.license);
    if (photo) return photo;
  }
  return undefined;
}

/** Chỉ tải cùng nguồn gốc; ảnh hỏng hoặc hết thời gian trả null để vẫn xuất được bản chữ. */
async function loadCover(url: string | undefined): Promise<HTMLImageElement | null> {
  if (!url || new URL(url, location.href).origin !== location.origin) return null;
  return new Promise(resolve => {
    const image = new Image();
    const timeout = window.setTimeout(() => { image.src = ''; resolve(null); }, PNG.imageTimeoutMs);
    image.onload = () => { clearTimeout(timeout); resolve(image); };
    image.onerror = () => { clearTimeout(timeout); resolve(null); };
    image.src = url;
  });
}

/** Đặt font đã nạp của ứng dụng, dùng cùng cách đo và vẽ cho mọi dòng. */
function setFont(ctx: CanvasRenderingContext2D, role: TextRole, family: string): void {
  const weight = role === 'heading' || role === 'title' ? '700' : '400';
  ctx.font = `${weight} ${FONT_SIZE[role]}px ${family}`;
}

/** Cắt ảnh theo tâm để lấp vùng bìa, không làm méo tỷ lệ ảnh gốc. */
function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement): void {
  const scale = Math.max(PNG.width / image.naturalWidth, PNG.coverHeight / image.naturalHeight);
  const width = PNG.width / scale;
  const height = PNG.coverHeight / scale;
  ctx.drawImage(image, (image.naturalWidth - width) / PNG.centerDivisor, (image.naturalHeight - height) / PNG.centerDivisor, width, height, 0, 0, PNG.width, PNG.coverHeight);
}

/** Mã hóa canvas thành PNG thật, báo lỗi nếu trình duyệt thiếu bộ nhớ hoặc không tạo được blob. */
function toPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error(C.error)), PNG.mime));
}

interface PaintOptions {
  readonly family: string;
  readonly style: CSSStyleDeclaration;
  readonly image: HTMLImageElement | null;
  readonly credit: readonly string[];
}

/** Vẽ một phân đoạn bằng token ứng dụng; ghi công riêng không bị cắt và nhãn ảnh nhỏ ở chân. */
async function paintPage(page: LayoutPage, index: number, count: number, options: PaintOptions): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const height = page.height ?? PNG.maxHeight;
  canvas.width = PNG.width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(C.error);
  const { family, style, image, credit } = options;
  const footerTop = height - PNG.margin * PNG.edgeCount - (credit.length + 1) * PNG.smallLine;
  ctx.fillStyle = style.getPropertyValue('--surface').trim();
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!index && image) drawCover(ctx, image);
  for (const line of page.lines) {
    setFont(ctx, line.role, family);
    ctx.fillStyle = style.getPropertyValue(line.role === 'heading' ? '--brand-ink' : line.role === 'small' ? '--muted' : '--ink').trim();
    ctx.fillText(line.text, PNG.margin, line.y + FONT_SIZE[line.role]);
  }
  setFont(ctx, 'small', family);
  ctx.fillStyle = style.getPropertyValue('--muted').trim();
  credit.forEach((text, i) => ctx.fillText(text, PNG.margin, footerTop + i * PNG.smallLine + PNG.smallSize));
  ctx.fillText(count > 1 ? `${C.brand} · ${C.page} ${index + 1}/${count}` : C.brand, PNG.margin, height - PNG.margin);
  return toPng(canvas);
}

/** Chờ font, đo bố cục rồi vẽ PNG; mọi URL xem trước dùng chính blob sẽ tải và được bên gọi thu hồi. */
export async function renderPng(input: ExportInput): Promise<PngFile[]> {
  const blocks = exportBlocks(input);
  const photo = heroPhoto(input.destination);
  const family = getComputedStyle(document.body).fontFamily;
  const fontText = [...blocks.map(block => block.text), photo?.author ?? '', photo?.license ?? '', C.photoMissing, C.continued, C.brand].join(' ');
  await Promise.all(['400', '700'].map(weight => document.fonts.load(`${weight} ${PNG.bodySize}px ${family}`, fontText)));
  await document.fonts.ready;
  const image = await loadCover(photo?.url);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error(C.error);
  /** Đo theo đúng font vai trò, không ước lượng theo số ký tự. */
  const measure = (text: string, role: TextRole): number => { setFont(ctx, role, family); return ctx.measureText(text).width; };
  const creditText = image && photo ? `${C.photo}: ${photo.author} · ${photo.license}` : C.photoMissing;
  const credit = wrapText(creditText, PNG.width - PNG.margin * PNG.edgeCount, text => measure(text, 'small'));
  const footer = PNG.margin * PNG.edgeCount + (credit.length + 1) * PNG.smallLine;
  const top = (image ? PNG.coverHeight : 0) + PNG.margin;
  const pages = fitPages(blocks, measure, { top, nextTop: PNG.margin, footer });
  const files: PngFile[] = [];
  try {
    for (const [index, page] of pages.entries()) {
      const blob = await paintPage(page, index, pages.length, { family, image, credit, style: getComputedStyle(document.documentElement) });
      files.push({ blob, url: URL.createObjectURL(blob), filename: pngFilename(input.trip.name, index, pages.length), width: PNG.width, height: page.height ?? PNG.maxHeight });
    }
    return files;
  } catch (error) {
    files.forEach(file => URL.revokeObjectURL(file.url));
    throw error;
  }
}
