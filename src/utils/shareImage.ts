import html2canvas from 'html2canvas-pro'
import { toast } from 'vue-sonner'

export async function shareElementAsImage(
  selector: string,
  title: string,
  filename: string,
  onClone?: (clonedDoc: Document, container: HTMLElement) => void,
): Promise<void> {
  const el = document.querySelector(selector) as HTMLElement | null
  if (!el) {
    toast.error('未找到分享内容')
    return
  }

  const tempId = 'share-container-' + Date.now()
  el.id = tempId

  try {
    const canvas = await html2canvas(el, {
      useCORS: true,
      scale: 2,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        const container = clonedDoc.getElementById(tempId)
        if (!container) return
        container.style.padding = '20px'

        const header = clonedDoc.createElement('div')
        header.style.cssText = 'text-align:center;margin-bottom:20px;'
        header.innerHTML = `<h2 style="margin:0;">${title}</h2>
                           <p style="color:#909399;margin:5px 0;">生成日期: ${new Date().toLocaleString()}</p>`
        container.insertBefore(header, container.firstChild)

        onClone?.(clonedDoc, container)
      },
    })

    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `${filename}_${new Date().toLocaleDateString()}.png`
    link.href = url
    link.click()
    toast.success('生成成功，请在浏览器下载管理中查看')
  } catch (err) {
    console.log(err)
    toast.error('生成图片失败，请重试')
  } finally {
    el.id = ''
  }
}
