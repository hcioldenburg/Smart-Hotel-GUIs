import React from 'react';

const FlourishEmbed = () => {
  return (
    <div>
      <iframe
        src="https://flo.uri.sh/visualisation/24521807/embed"
        title="Interactive or visual content"
        className="flourish-embed-iframe"
        frameBorder="0"
        scrolling="no"
        style={{ width: '100%', height: '600px' }}
        sandbox="allow-same-origin allow-forms allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      ></iframe>
      <div
        style={{
          width: '100%',
          marginTop: '4px',
          textAlign: 'right',
        }}
      >
      </div>
    </div>
  );
};

export default FlourishEmbed;
