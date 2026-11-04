import type { DestinationDetail } from '../../discover/index.ts';
import type { Trip } from '../model/trip.types.ts';

/** `summary`: mỗi ngày một đoạn tên các nơi (dễ gửi nhóm); `days`: từng mục theo thứ tự kèm giờ/giá đã biết. */
export type ExportStyle = 'summary' | 'days';
export interface ExportInput { readonly trip: Trip; readonly destination: DestinationDetail; readonly style?: ExportStyle }
export type TextRole = 'title' | 'heading' | 'body' | 'small';
export interface TextBlock { readonly text: string; readonly role: TextRole; readonly keepNext?: boolean; readonly maxLines?: number; readonly section?: string }
export interface TextLine { readonly text: string; readonly role: TextRole; readonly y: number }
export interface LayoutPage { readonly lines: readonly TextLine[]; readonly height?: number }
export interface PngFile { readonly blob: Blob; readonly url: string; readonly filename: string; readonly width: number; readonly height: number }
export type MeasureText = (text: string, role: TextRole) => number;
