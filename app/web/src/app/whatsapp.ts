import { whatsappNumber } from './config';

/** A wa.me link that opens the chat with `message` already typed. */
export function whatsappUrl(message: string, number: string = whatsappNumber): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
