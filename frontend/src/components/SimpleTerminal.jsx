import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

const SimpleTerminal = ({ deviceId, sessionId, onCommand, isConnected }) => {
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const [currentLine, setCurrentLine] = useState('');

  const handleCommand = async (command) => {
    try {
      let apiUrl, requestBody;
      
      if (sessionId) {
        // Phase 2 multi-device API
        apiUrl = '/api/phase2-labs/command';
        requestBody = JSON.stringify({ 
          sessionId,
          deviceId,
          command 
        });
      } else {
        // Phase 1 single device API
        apiUrl = '/api/simulation/test-command';
        requestBody = JSON.stringify({ 
          deviceId,
          command 
        });
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: requestBody
      });

      const result = await response.json();
      
      if (result.success) {
        if (terminal.current) {
          terminal.current.write('\r\n');
          terminal.current.write(result.output);
          terminal.current.write('\r\n');
          showPrompt();
        }
      } else {
        if (terminal.current) {
          terminal.current.write('\r\n');
          terminal.current.write(`Error: ${result.message || 'Command failed'}`);
          terminal.current.write('\r\n');
          showPrompt();
        }
      }
    } catch (error) {
      if (terminal.current) {
        terminal.current.write('\r\n');
        terminal.current.write(`Error: ${error.message}`);
        terminal.current.write('\r\n');
        showPrompt();
      }
    }
  };

  useEffect(() => {
    if (!terminalRef.current || terminal.current) return;

    const initTerminal = () => {
      try {
        // Check if DOM element exists and has a parent
        if (!terminalRef.current || !terminalRef.current.parentElement) {
          return false;
        }

        // Initialize terminal
        terminal.current = new Terminal({
          cursorBlink: true,
          theme: {
            background: '#000000',
            foreground: '#00ff00',
            cursor: '#00ff00',
            selection: '#ffffff',
          },
          fontSize: 14,
          fontFamily: 'Consolas, Monaco, monospace',
        });

        fitAddon.current = new FitAddon();
        terminal.current.loadAddon(fitAddon.current);
        
        // Open terminal
        terminal.current.open(terminalRef.current);
        fitAddon.current.fit();
        
        // Handle terminal input
        terminal.current.onData((data) => {
          if (data === '\r') {
            // Enter key pressed
            const command = currentLine.trim();
            if (command) {
              handleCommand(command);
              setCurrentLine('');
            } else {
              terminal.current.write('\r\n');
              showPrompt();
            }
          } else if (data === '\u007F') {
            // Backspace
            if (currentLine.length > 0) {
              setCurrentLine(prev => prev.slice(0, -1));
              terminal.current.write('\b \b');
            }
          } else if (data === '\u0003') {
            // Ctrl+C
            terminal.current.write('^C\r\n');
            setCurrentLine('');
            showPrompt();
          } else if (data >= ' ' && data <= '~') {
            // Printable characters
            setCurrentLine(prev => prev + data);
            terminal.current.write(data);
          }
        });

        // Show initial prompt
        showPrompt();
        return true;
      } catch (error) {
        console.error('Failed to initialize terminal:', error);
        return false;
      }
    };

    // Try to initialize immediately
    if (!initTerminal()) {
      // If immediate initialization fails, try again after a delay
      const timer = setTimeout(() => {
        initTerminal();
      }, 200);

      return () => {
        clearTimeout(timer);
        if (terminal.current) {
          terminal.current.dispose();
        }
      };
    }

    return () => {
      if (terminal.current) {
        terminal.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    // Handle terminal resize
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showPrompt = () => {
    if (terminal.current) {
      const prompt = isConnected ? `${deviceId}> ` : `${deviceId}(disconnected)> `;
      terminal.current.write(prompt);
    }
  };

  const writeOutput = (text, color = '#00ff00') => {
    if (terminal.current) {
      terminal.current.write(`\x1b[${color === '#ff0000' ? '31' : '32'}m${text}\x1b[0m\r\n`);
      showPrompt();
    }
  };

  const writeError = (text) => {
    writeOutput(text, '#ff0000');
  };

  const writeSuccess = (text) => {
    writeOutput(text, '#00ff00');
  };

  // Expose methods to parent
  React.useImperativeHandle(terminalRef, () => ({
    writeOutput,
    writeError,
    writeSuccess,
    clear: () => {
      if (terminal.current) {
        terminal.current.clear();
        showPrompt();
      }
    }
  }));

  return (
    <div className="bg-black rounded-lg p-4 h-96">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-green-400 text-sm font-mono">
          {deviceId} Terminal
        </div>
        <div className={`text-xs px-2 py-1 rounded ${
          isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      <div 
        ref={terminalRef}
        className="h-full w-full"
        style={{ minHeight: '300px' }}
      />
    </div>
  );
};

export default SimpleTerminal;
