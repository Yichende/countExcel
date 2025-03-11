import React from "react";
import "./TextArea.css";
import { useRef, useEffect } from "react";

const Textarea = ({ content }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]); // 监听 content 变化，自动滚动到底部
  return (
    content && (
      <div
        className="readonly-textarea"
        ref={contentRef}>
        <div className="content-box">{content}</div>
      </div>
    )
  );
};

export default Textarea;
