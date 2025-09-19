import React, { useState, useEffect, useRef } from 'react';

// Message types for the algorithm
const MessageType = {
  REQUEST: 'REQUEST',
  REPLY: 'REPLY'
};

// Node states
const NodeState = {
  RELEASED: 'RELEASED',
  WANTED: 'WANTED',
  HELD: 'HELD'
};

const RicartAgrawalaAlgorithm = () => {
  const [nodes, setNodes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [logicalClock, setLogicalClock] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [selectedNode, setSelectedNode] = useState(null);
  const intervalRef = useRef(null);

  // Initialize nodes
  useEffect(() => {
    initializeNodes(3);
  }, []);

  const initializeNodes = (count) => {
    const newNodes = Array.from({ length: count }, (_, i) => ({
      id: i,
      name: `Node ${i}`,
      state: NodeState.RELEASED,
      timestamp: 0,
      pendingReplies: new Set(),
      deferredReplies: [],
      logicalClock: 0,
      inCriticalSection: false,
      criticalSectionTimer: 0,
      requestQueue: []
    }));
    setNodes(newNodes);
    setMessages([]);
    setLogicalClock(0);
  };

  // Lamport's logical clock update
  const updateLogicalClock = (receivedTimestamp = 0) => {
    setLogicalClock(prev => Math.max(prev, receivedTimestamp) + 1);
    return Math.max(logicalClock, receivedTimestamp) + 1;
  };

  // Request critical section
  const requestCriticalSection = (nodeId) => {
    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      const node = newNodes[nodeId];
      
      if (node.state !== NodeState.RELEASED) return prevNodes;
      
      // Update node state and timestamp
      const newTimestamp = updateLogicalClock();
      node.state = NodeState.WANTED;
      node.timestamp = newTimestamp;
      node.logicalClock = newTimestamp;
      node.pendingReplies.clear();
      
      // Add all other nodes to pending replies
      for (let i = 0; i < newNodes.length; i++) {
        if (i !== nodeId) {
          node.pendingReplies.add(i);
        }
      }
      
      // Send REQUEST messages to all other nodes
      for (let i = 0; i < newNodes.length; i++) {
        if (i !== nodeId) {
          sendMessage(nodeId, i, MessageType.REQUEST, newTimestamp);
        }
      }
      
      return newNodes;
    });
  };

  // Send message
  const sendMessage = (fromId, toId, type, timestamp) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      from: fromId,
      to: toId,
      type,
      timestamp,
      delivered: false,
      deliveryTime: Date.now() + Math.random() * 2000
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-deliver message after delay
    setTimeout(() => {
      deliverMessage(newMessage.id);
    }, Math.random() * 1000 + 500);
  };

  // Deliver message
  const deliverMessage = (messageId) => {
    setMessages(prevMessages => {
      const message = prevMessages.find(m => m.id === messageId);
      if (!message || message.delivered) return prevMessages;
      
      // Process the message
      processMessage(message);
      
      return prevMessages.map(m => 
        m.id === messageId ? { ...m, delivered: true } : m
      );
    });
  };

  // Process received message
  const processMessage = (message) => {
    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      const receiver = newNodes[message.to];
      
      // Update logical clock
      receiver.logicalClock = Math.max(receiver.logicalClock, message.timestamp) + 1;
      
      if (message.type === MessageType.REQUEST) {
        // Ricart-Agrawala algorithm logic for REQUEST
        const shouldReply = (
          receiver.state === NodeState.RELEASED ||
          (receiver.state === NodeState.WANTED && 
           (message.timestamp < receiver.timestamp || 
            (message.timestamp === receiver.timestamp && message.from < receiver.id)))
        );
        
        if (shouldReply) {
          // Send immediate reply
          setTimeout(() => {
            sendMessage(message.to, message.from, MessageType.REPLY, receiver.logicalClock);
          }, 100);
        } else {
          // Defer reply
          receiver.deferredReplies.push(message.from);
        }
      } else if (message.type === MessageType.REPLY) {
        // Remove from pending replies
        receiver.pendingReplies.delete(message.from);
        
        // Check if can enter critical section
        if (receiver.state === NodeState.WANTED && receiver.pendingReplies.size === 0) {
          receiver.state = NodeState.HELD;
          receiver.inCriticalSection = true;
          receiver.criticalSectionTimer = 3;
        }
      }
      
      return newNodes;
    });
  };

  // Release critical section
  const releaseCriticalSection = (nodeId) => {
    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      const node = newNodes[nodeId];
      
      if (node.state !== NodeState.HELD) return prevNodes;
      
      node.state = NodeState.RELEASED;
      node.inCriticalSection = false;
      node.criticalSectionTimer = 0;
      
      // Send deferred replies
      node.deferredReplies.forEach(deferredNodeId => {
        sendMessage(nodeId, deferredNodeId, MessageType.REPLY, node.logicalClock);
      });
      node.deferredReplies = [];
      
      return newNodes;
    });
  };

  // Simulation step
  const simulationStep = () => {
    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      
      newNodes.forEach((node, index) => {
        // Handle critical section timer
        if (node.inCriticalSection && node.criticalSectionTimer > 0) {
          node.criticalSectionTimer -= 1;
          if (node.criticalSectionTimer === 0) {
            releaseCriticalSection(index);
          }
        }
        
        // Random requests (10% chance per step)
        if (node.state === NodeState.RELEASED && Math.random() < 0.1) {
          setTimeout(() => requestCriticalSection(index), Math.random() * 500);
        }
      });
      
      return newNodes;
    });
  };

  // Start/stop simulation
  const toggleSimulation = () => {
    if (isRunning) {
      clearInterval(intervalRef.current);
    } else {
      intervalRef.current = setInterval(simulationStep, speed);
    }
    setIsRunning(!isRunning);
  };

  // Reset simulation
  const resetSimulation = () => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    initializeNodes(nodes.length);
  };

  // Change number of nodes
  const changeNodeCount = (count) => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    initializeNodes(count);
  };

  // Styles
  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      padding: '20px'
    },
    header: {
      marginBottom: '20px'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#666',
      fontSize: '16px'
    },
    controls: {
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '15px',
      alignItems: 'center'
    },
    button: {
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '5px'
    },
    startButton: {
      backgroundColor: isRunning ? '#dc3545' : '#28a745',
      color: 'white'
    },
    resetButton: {
      backgroundColor: '#6c757d',
      color: 'white'
    },
    select: {
      padding: '5px 10px',
      borderRadius: '4px',
      border: '1px solid #ddd'
    },
    slider: {
      width: '100px'
    },
    statusGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px'
    },
    statusCard: {
      padding: '15px',
      borderRadius: '8px',
      textAlign: 'center'
    },
    clockCard: {
      backgroundColor: '#e3f2fd'
    },
    nodesCard: {
      backgroundColor: '#e8f5e8'
    },
    messagesCard: {
      backgroundColor: '#f3e5f5'
    },
    statusValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginTop: '8px'
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px'
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: '#333'
    },
    nodeCard: {
      marginBottom: '15px',
      padding: '15px',
      borderRadius: '8px',
      border: '2px solid',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    nodeGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      fontSize: '14px',
      marginTop: '10px'
    },
    nodeButtons: {
      marginTop: '10px'
    },
    nodeButton: {
      padding: '6px 12px',
      marginRight: '8px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    enabledButton: {
      backgroundColor: '#007bff',
      color: 'white'
    },
    disabledButton: {
      backgroundColor: '#dee2e6',
      color: '#6c757d',
      cursor: 'not-allowed'
    },
    releaseButton: {
      backgroundColor: '#dc3545',
      color: 'white'
    },
    messageQueue: {
      height: '400px',
      overflowY: 'auto',
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px'
    },
    message: {
      marginBottom: '10px',
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid'
    },
    requestMessage: {
      backgroundColor: '#cce5ff',
      borderColor: '#66b3ff'
    },
    replyMessage: {
      backgroundColor: '#e6ccff',
      borderColor: '#b366ff'
    },
    deliveredMessage: {
      opacity: '0.6'
    },
    messageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '5px',
      fontWeight: 'bold'
    },
    messageStatus: {
      fontSize: '12px',
      padding: '2px 6px',
      borderRadius: '4px'
    },
    delivered: {
      backgroundColor: '#d4edda',
      color: '#155724'
    },
    inTransit: {
      backgroundColor: '#fff3cd',
      color: '#856404'
    },
    explanation: {
      marginTop: '30px',
      padding: '20px',
      backgroundColor: '#e3f2fd',
      borderRadius: '8px'
    },
    explanationTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px'
    },
    explanationList: {
      fontSize: '14px',
      lineHeight: '1.6'
    },
    explanationItem: {
      marginBottom: '10px'
    }
  };

  const getNodeStateStyle = (state, selected) => {
    let baseStyle = { ...styles.nodeCard };
    
    switch (state) {
      case NodeState.RELEASED:
        baseStyle.backgroundColor = '#d4edda';
        baseStyle.borderColor = '#28a745';
        baseStyle.color = '#155724';
        break;
      case NodeState.WANTED:
        baseStyle.backgroundColor = '#fff3cd';
        baseStyle.borderColor = '#ffc107';
        baseStyle.color = '#856404';
        break;
      case NodeState.HELD:
        baseStyle.backgroundColor = '#f8d7da';
        baseStyle.borderColor = '#dc3545';
        baseStyle.color = '#721c24';
        break;
    }
    
    if (selected) {
      baseStyle.boxShadow = '0 0 0 3px rgba(0,123,255,0.5)';
    }
    
    return baseStyle;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>
            Ricart-Agrawala Distributed Mutual Exclusion Algorithm
          </h1>
          <p style={styles.subtitle}>
            A distributed algorithm for mutual exclusion using logical timestamps and message passing
          </p>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <button
            onClick={toggleSimulation}
            style={{...styles.button, ...styles.startButton}}
          >
            {isRunning ? '⏸️ Pause' : '▶️ Start'} Simulation
          </button>
          
          <button
            onClick={resetSimulation}
            style={{...styles.button, ...styles.resetButton}}
          >
            🔄 Reset
          </button>
          
          <div>
            <label style={{marginRight: '8px'}}>Nodes:</label>
            <select
              value={nodes.length}
              onChange={(e) => changeNodeCount(parseInt(e.target.value))}
              style={styles.select}
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          
          <div>
            <label style={{marginRight: '8px'}}>Speed:</label>
            <input
              type="range"
              min="100"
              max="2000"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              style={styles.slider}
            />
            <span style={{marginLeft: '8px'}}>{speed}ms</span>
          </div>
        </div>

        {/* Algorithm Status */}
        <div style={styles.statusGrid}>
          <div style={{...styles.statusCard, ...styles.clockCard}}>
            <div>🕐 Global Logical Clock</div>
            <div style={{...styles.statusValue, color: '#1976d2'}}>{logicalClock}</div>
          </div>
          
          <div style={{...styles.statusCard, ...styles.nodesCard}}>
            <div>👥 Active Nodes</div>
            <div style={{...styles.statusValue, color: '#388e3c'}}>{nodes.length}</div>
          </div>
          
          <div style={{...styles.statusCard, ...styles.messagesCard}}>
            <div>💬 Messages in Flight</div>
            <div style={{...styles.statusValue, color: '#7b1fa2'}}>
              {messages.filter(m => !m.delivered).length}
            </div>
          </div>
        </div>

        <div style={styles.mainGrid}>
          {/* Nodes */}
          <div>
            <h2 style={styles.sectionTitle}>Distributed Nodes</h2>
            
            {nodes.map((node, index) => (
              <div
                key={node.id}
                style={getNodeStateStyle(node.state, selectedNode === index)}
                onClick={() => setSelectedNode(selectedNode === index ? null : index)}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <span style={{fontSize: '18px', fontWeight: 'bold'}}>{node.name}</span>
                    {node.inCriticalSection && <span>🔒</span>}
                    {node.state === NodeState.RELEASED && <span>🔓</span>}
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: '14px'}}>State: <strong>{node.state}</strong></div>
                    <div style={{fontSize: '14px'}}>Clock: {node.logicalClock}</div>
                  </div>
                </div>
                
                <div style={styles.nodeGrid}>
                  <div>
                    <div style={{fontWeight: 'bold'}}>Request Timestamp:</div>
                    <div>{node.timestamp || 'None'}</div>
                  </div>
                  <div>
                    <div style={{fontWeight: 'bold'}}>Pending Replies:</div>
                    <div>{node.pendingReplies.size > 0 ? Array.from(node.pendingReplies).join(', ') : 'None'}</div>
                  </div>
                  <div>
                    <div style={{fontWeight: 'bold'}}>Deferred Replies:</div>
                    <div>{node.deferredReplies.length > 0 ? node.deferredReplies.join(', ') : 'None'}</div>
                  </div>
                  <div>
                    <div style={{fontWeight: 'bold'}}>CS Timer:</div>
                    <div>{node.criticalSectionTimer > 0 ? `${node.criticalSectionTimer}s` : 'N/A'}</div>
                  </div>
                </div>
                
                <div style={styles.nodeButtons}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      requestCriticalSection(index);
                    }}
                    disabled={node.state !== NodeState.RELEASED}
                    style={{
                      ...styles.nodeButton,
                      ...(node.state === NodeState.RELEASED ? styles.enabledButton : styles.disabledButton)
                    }}
                  >
                    Request Critical Section
                  </button>
                  
                  {node.state === NodeState.HELD && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        releaseCriticalSection(index);
                      }}
                      style={{...styles.nodeButton, ...styles.releaseButton}}
                    >
                      Release CS
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Messages */}
          <div>
            <h2 style={styles.sectionTitle}>Message Queue</h2>
            
            <div style={styles.messageQueue}>
              {messages.slice(-20).reverse().map((message) => (
                <div
                  key={message.id}
                  style={{
                    ...styles.message,
                    ...(message.type === MessageType.REQUEST ? styles.requestMessage : styles.replyMessage),
                    ...(message.delivered ? styles.deliveredMessage : {})
                  }}
                >
                  <div style={styles.messageHeader}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                      <span>📤</span>
                      <span>
                        Node {message.from} → Node {message.to}
                      </span>
                    </div>
                    <span style={{
                      ...styles.messageStatus,
                      ...(message.delivered ? styles.delivered : styles.inTransit)
                    }}>
                      {message.delivered ? 'Delivered' : 'In Transit'}
                    </span>
                  </div>
                  
                  <div style={{fontSize: '14px'}}>
                    <div>Type: <strong>{message.type}</strong></div>
                    <div>Timestamp: {message.timestamp}</div>
                  </div>
                </div>
              ))}
              
              {messages.length === 0 && (
                <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
                  No messages yet. Start the simulation to see message exchanges.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Algorithm Explanation */}
        <div style={styles.explanation}>
          <h3 style={styles.explanationTitle}>How Ricart-Agrawala Algorithm Works:</h3>
          
          <div style={styles.explanationList}>
            <div style={styles.explanationItem}>
              <strong>1. Request Phase:</strong> When a node wants to enter the critical section, it sends REQUEST messages with its logical timestamp to all other nodes.
            </div>
            <div style={styles.explanationItem}>
              <strong>2. Reply Logic:</strong> A node replies immediately to a REQUEST if:
              <ul style={{marginLeft: '20px', marginTop: '5px'}}>
                <li>It's in RELEASED state, OR</li>
                <li>It's in WANTED state but has a higher timestamp (or same timestamp but higher node ID)</li>
              </ul>
              Otherwise, it defers the reply.
            </div>
            <div style={styles.explanationItem}>
              <strong>3. Entry Condition:</strong> A node enters the critical section when it has received REPLY messages from all other nodes.
            </div>
            <div style={styles.explanationItem}>
              <strong>4. Release Phase:</strong> When exiting the critical section, the node sends all deferred REPLY messages.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RicartAgrawalaAlgorithm;