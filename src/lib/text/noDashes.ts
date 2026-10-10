// Em dashes are banned from everything Solace says. The model, the on-device
// model and the written templates can all produce them, so every reply is
// passed through this on the way in and again when it is shown.
export function stripDashes(text: string): string {
  return text
    .replace(/(\d)\s*[–—]\s*(\d)/g, '$1-$2')
    .replace(/\s*[—―–]+\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*([.!?;:])/g, '$1')
    .replace(/^,\s*/, '');
}
