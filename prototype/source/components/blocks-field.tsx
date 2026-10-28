import { useState } from "react";
import type { BlockType, EmailBlock } from "@/lib/email-blocks";
import type { MediaItem } from "@/lib/site-images";
import { BlockList, Palette, insertAfter } from "./block-editor";

const articleBlocks: BlockType[] = [
  "heading",
  "text",
  "image",
  "quote",
  "button",
  "divider",
  "spacer",
  "social",
  "html",
];

/** Block editor inside a form; the blocks are submitted as JSON in `name`. */
export function BlocksField({
  name = "blocks",
  label,
  initial,
  media,
  types = articleBlocks,
}: {
  name?: string;
  label: string;
  initial: EmailBlock[];
  media: MediaItem[];
  types?: BlockType[];
}) {
  const [blocks, setBlocks] = useState(initial);
  const [selected, setSelected] = useState<string>();
  return (
    <div className="blocks-field">
      <div className="blocks-field-head">
        <span className="blocks-field-label">{label}</span>
        <Palette
          compact
          types={types}
          onAdd={(block) => {
            setBlocks(insertAfter(blocks, selected, block));
            setSelected(block.id);
          }}
        />
      </div>
      <div className="email-stage article-stage">
        <div className="email-card article-canvas">
          <BlockList
            blocks={blocks}
            onChange={setBlocks}
            selected={selected}
            onSelect={setSelected}
            media={media}
            label={label}
          />
        </div>
      </div>
      <input type="hidden" name={name} value={JSON.stringify(blocks)} />
    </div>
  );
}
