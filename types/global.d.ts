interface Window {
  kofiWidgetOverlay?: {
    draw: (username: string, config: {
      type: string;
      'floating-chat.donateButton.text': string;
      'floating-chat.donateButton.background-color': string;
      'floating-chat.donateButton.text-color': string;
    }) => void;
  };
}
