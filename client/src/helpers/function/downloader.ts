export const download = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const getExtension = (mimeTypeAndCodec: string) => {
  const mimeType = mimeTypeAndCodec.split(";")[0];
  const extension = mimeType.split("/")[1];
  return extension;
};
