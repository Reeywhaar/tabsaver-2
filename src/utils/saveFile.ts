export async function saveFile(value: BlobPart, fileName: string, fileType: string = 'application/json') {
  const blob = new Blob([value], { type: fileType })
  const url = URL.createObjectURL(blob)

  await browser.downloads.download({
    url,
    filename: fileName,
    saveAs: true,
  })
}
