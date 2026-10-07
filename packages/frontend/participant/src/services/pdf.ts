export interface PdfPage {
  backgroundImageUrl?: string
  contentHtml: string
  validationCode?: string
  layout?: {
    orientation?: string
    padding?:
      | {
          top?: string | number
          right?: string | number
          bottom?: string | number
          left?: string | number
        }
      | string
      | number
    vertical?: {
      name?: string
      value?: number
    }
    horizontal?: {
      name?: string
      value?: number
    }
  }
}

export interface GenerateCertificatePdfOptions {
  pages: PdfPage[]
  filename: string
}

async function renderCertificatePdf(pages: PdfPage[]) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ])

  const MM_W = 297
  const MM_H = 210
  const SCALE = 2
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  for (let i = 0; i < pages.length; i++) {
    const { backgroundImageUrl, contentHtml, validationCode, layout } = pages[i]
    const orientation = layout?.orientation || 'horizontal'
    const verticalPosition = layout?.vertical?.name || 'bottom'
    const horizontalPosition = layout?.horizontal?.name || 'right'
    const verticalPadding =
      layout?.vertical?.value !== undefined ? Number(layout.vertical.value) : 0
    const horizontalPadding =
      layout?.horizontal?.value !== undefined
        ? Number(layout.horizontal.value)
        : 0
    let paddingStyle = ''
    if (layout?.padding) {
      if (typeof layout.padding === 'object') {
        const top = layout.padding.top !== undefined ? layout.padding.top : 0
        const bottom =
          layout.padding.bottom !== undefined ? layout.padding.bottom : 0
        const left = layout.padding.left !== undefined ? layout.padding.left : 0
        const right =
          layout.padding.right !== undefined ? layout.padding.right : 0
        paddingStyle = `padding-top:${top}%;padding-bottom:${bottom}%;padding-left:${left}%;padding-right:${right}%;`
      } else {
        paddingStyle = `padding:${layout.padding}%;`
      }
    }
    let validationStyle = `
      position: absolute;
      font-size: small;
      white-space: nowrap;
      z-index: 2;
    `
    if (orientation === 'horizontal') {
      validationStyle += `
        ${verticalPosition}: 0;
        left: calc(50% + ${horizontalPadding}%);
        transform: translateX(-50%);
      `
    } else {
      validationStyle += `
        writing-mode: vertical-rl;
        top: calc(50% + ${verticalPadding}%);
        transform: translateY(-50%);
        ${horizontalPosition}: 0;
      `
    }

    const container = document.createElement('div')
    Object.assign(container.style, {
      position: 'absolute',
      left: '-9999px',
      top: '0px',
      width: `${MM_W}mm`,
      height: `${MM_H}mm`,
      overflow: 'hidden',
      boxSizing: 'border-box',
      margin: '0',
      padding: '0',
      fontFamily: 'Georgia, "Times New Roman", serif',
      color: '#1f2933',
      backgroundColor: '#fff'
    })

    container.innerHTML = `
      <div style="position:relative;width:100%;height:100%;overflow:hidden;">
        ${
          backgroundImageUrl
            ? `<img
              src="${backgroundImageUrl}"
              style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"
              crossorigin="anonymous"
            />`
            : ''
        }
        <div style="
          position:absolute;
          inset:0;
          z-index:1;
          box-sizing:border-box;
          ${paddingStyle}
        ">
          <div style="
            display:flex;
            width:100%;
            height:100%;
          ">
            <div style="
              width:100%;
              margin-top:auto;
              margin-bottom:auto;
              text-align:center;
            ">
              ${contentHtml}
            </div>
          </div>
        </div>
        ${
          validationCode
            ? `<div style="${validationStyle}">Código: <strong>${validationCode}</strong></div>`
            : ''
        }
      </div>
    `

    document.body.appendChild(container)

    try {
      const imgs = Array.from(container.querySelectorAll('img'))
      await Promise.all(
        imgs.map(
          img =>
            new Promise<void>(resolve => {
              if (img.complete) {
                resolve()
              } else {
                img.onload = () => resolve()
                img.onerror = () => resolve()
              }
            })
        )
      )

      const canvas = await html2canvas(container, {
        scale: SCALE,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: container.offsetWidth,
        height: container.offsetHeight,
        logging: false
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, 0, MM_W, MM_H)
    } finally {
      document.body.removeChild(container)
    }
  }

  return pdf
}

export async function buildCertificatePdf(pages: PdfPage[]): Promise<Blob> {
  const pdf = await renderCertificatePdf(pages)
  return pdf.output('blob')
}

export async function generateCertificatePdf(
  options: GenerateCertificatePdfOptions
): Promise<void> {
  if (typeof window === 'undefined') return
  const pdf = await renderCertificatePdf(options.pages)
  pdf.save(`${options.filename}.pdf`)
}
