import QRCode from 'qrcode'

export async function generateQRDataURL(qrString: string): Promise<string> {
  return await QRCode.toDataURL(qrString, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  })
}
