export function getFileDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => {
      if (typeof fr.result === 'string') {
        resolve(fr.result)
      } else {
        reject(new Error('Failed to read file as data URL'))
      }
    }
    fr.onerror = () => reject(fr.error || new Error('Failed to read file'))
    fr.readAsDataURL(file)
  })
}
