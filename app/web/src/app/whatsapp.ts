import { whatsappNumber } from './config';

/** A wa.me link that opens the chat with `message` already typed. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
