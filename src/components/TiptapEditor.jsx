import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";

const TBtn = ({ label, title, onClick, active, style = {} }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    style={{
      padding: "5px 8px",
      fontSize: "13px",
      lineHeight: 1,
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      background: active ? "rgba(10,174,232,0.12)" : "transparent",
      color: active ? "var(--accent)" : "#344054",
      fontWeight: 600,
      flexShrink: 0,
      ...style,
    }}
  >
    {label}
  </button>
);

const Sep = () => (
  <div style={{ width: "1px", height: "18px", background: "#D0D5DD", margin: "0 2px", flexShrink: 0 }} />
);

export default function TiptapEditor({ value, onChange, onImageUpload, placeholder = "開始輸入..." }) {
  const imageInputRef = useRef(null);
  const [imgUploading, setImgUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  // Sync when value changes externally (initial load OR auto-translate filling the field).
  // setContent(..., false) skips onUpdate so there's no loop.
  useEffect(() => {
    if (!editor) return;
    const current = editor.storage.markdown.getMarkdown();
    if (value !== current) editor.commands.setContent(value || "", false);
  }, [value, editor]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("連結網址：");
    if (url?.trim()) editor.chain().focus().setLink({ href: url.trim() }).run();
  };

  const handleImageFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !onImageUpload) return;
    setImgUploading(true);
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch { }
    finally { setImgUploading(false); e.target.value = ""; }
  };

  if (!editor) return null;

  return (
    <div className="tiptap-wrapper">
      {/* Fixed Toolbar */}
      <div className="tiptap-toolbar">
        <TBtn label="B"  title="粗體 (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()}               active={editor.isActive("bold")}                  style={{ fontWeight: 900 }} />
        <TBtn label="I"  title="斜體 (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()}             active={editor.isActive("italic")}                style={{ fontStyle: "italic" }} />
        <TBtn label="S"  title="刪除線"         onClick={() => editor.chain().focus().toggleStrike().run()}             active={editor.isActive("strike")}                style={{ textDecoration: "line-through" }} />
        <Sep />
        <TBtn label="H1" title="大標題"         onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} style={{ fontWeight: 800 }} />
        <TBtn label="H2" title="中標題"         onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} style={{ fontWeight: 700 }} />
        <TBtn label="H3" title="小標題"         onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} style={{ fontWeight: 600 }} />
        <Sep />
        <TBtn label="•"  title="項目清單"       onClick={() => editor.chain().focus().toggleBulletList().run()}         active={editor.isActive("bulletList")}            style={{ fontSize: "18px", lineHeight: 0.8 }} />
        <TBtn label="1." title="編號清單"       onClick={() => editor.chain().focus().toggleOrderedList().run()}        active={editor.isActive("orderedList")} />
        <TBtn label="❝"  title="引言"           onClick={() => editor.chain().focus().toggleBlockquote().run()}         active={editor.isActive("blockquote")} />
        <TBtn label="`"  title="行內程式碼"     onClick={() => editor.chain().focus().toggleCode().run()}               active={editor.isActive("code")}                  style={{ fontFamily: "monospace" }} />
        <TBtn label="```" title="程式碼區塊"    onClick={() => editor.chain().focus().toggleCodeBlock().run()}          active={editor.isActive("codeBlock")}             style={{ fontFamily: "monospace", fontSize: "11px" }} />
        <Sep />
        <TBtn label="連結" title="插入／移除連結 (Ctrl+K)" onClick={handleLink} active={editor.isActive("link")} />
        <TBtn label="—"   title="水平分隔線"    onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} />
        {onImageUpload && (
          <>
            <TBtn label={imgUploading ? "上傳中…" : "插圖"} title="插入圖片" onClick={() => !imgUploading && imageInputRef.current?.click()} active={false} />
            <input type="file" ref={imageInputRef} accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />
          </>
        )}
        <Sep />
        <TBtn label="↩" title="復原 (Ctrl+Z)"  onClick={() => editor.chain().focus().undo().run()} active={false} />
        <TBtn label="↪" title="重做 (Ctrl+Y)"  onClick={() => editor.chain().focus().redo().run()} active={false} />
      </div>

      {/* Bubble Menu — quick access when text is selected */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 80 }}>
        <div className="tiptap-bubble">
          <button type="button" className={`tiptap-bubble-btn${editor.isActive("bold")   ? " active" : ""}`} onClick={() => editor.chain().focus().toggleBold().run()}   style={{ fontWeight: 900 }}>B</button>
          <button type="button" className={`tiptap-bubble-btn${editor.isActive("italic") ? " active" : ""}`} onClick={() => editor.chain().focus().toggleItalic().run()} style={{ fontStyle: "italic" }}>I</button>
          <button type="button" className={`tiptap-bubble-btn${editor.isActive("strike") ? " active" : ""}`} onClick={() => editor.chain().focus().toggleStrike().run()} style={{ textDecoration: "line-through" }}>S</button>
          <div style={{ width: "1px", background: "rgba(255,255,255,0.2)", margin: "2px 2px" }} />
          <button type="button" className={`tiptap-bubble-btn${editor.isActive("link")   ? " active" : ""}`} onClick={handleLink}>連結</button>
        </div>
      </BubbleMenu>

      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
}
