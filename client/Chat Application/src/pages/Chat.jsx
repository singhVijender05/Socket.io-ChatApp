import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'

function Chat() {
  const [messages, setMessages] = useState([])
  const fetchMessages = async () => {
    try {
      const res = await axios.get('http://localhost:5000/chat')
      setMessages(res.data)
    } catch (error) {
      console.log(error)
    }
  }
  useEffect(() => {
    fetchMessages()
  }, [])
  return (
    <div>
      {messages.map((message) => (
        <div key={message._id}>
          <h3>{message.name}</h3>
          <p>{message.message}</p>
        </div>
      ))}
    </div>
  )
}

export default Chat