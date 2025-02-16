'use client'

import Script from 'next/script'

export function KofiWidget() {
  return (
    <Script
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
      onLoad={() => {
        // @ts-ignore
        window.kofiWidgetOverlay?.draw('marcblattmann', {
          'type': 'floating-chat',
          'floating-chat.donateButton.text': 'Support me',
          'floating-chat.donateButton.background-color': '#00b9fe',
          'floating-chat.donateButton.text-color': '#fff'
        });
      }}
    />
  )
}
