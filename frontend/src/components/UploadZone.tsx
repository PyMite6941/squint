import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon } from "lucide-react";

interface Props {
  onFile: (file: File) => void;
  preview: string | null;
  disabled?: boolean;
}

const ACCEPTED = { "image/png": [], "image/jpeg": [], "image/webp": [], "image/gif": [] };
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB per spec

export default function UploadZone({ onFile, preview, disabled }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled,
  });

  const rejection = fileRejections[0]?.errors[0];
  const errorMsg =
    rejection?.code === "file-too-large"
      ? "File too large (max 5 MB)."
      : rejection
      ? "Unsupported file type."
      : null;

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden
          ${isDragActive ? "border-brand-500 bg-brand-500/5" : "border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-900"}
          ${disabled ? "opacity-50 pointer-events-none" : ""}
          ${preview ? "min-h-52" : "min-h-36"}`}
      >
        <input {...getInputProps()} />

        {preview ? (
          <>
            <img src={preview} alt="Screenshot preview" className="w-full h-full object-contain max-h-96" />
            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-sm text-white font-medium">Click or drop to change</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
              {isDragActive ? (
                <ImageIcon className="w-7 h-7 text-brand-400" />
              ) : (
                <Upload className="w-7 h-7 text-gray-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">
                {isDragActive ? "Drop it!" : "Drop your screenshot here"}
              </p>
              <p className="text-xs text-gray-600 mt-1">PNG, JPG, WebP — up to 5 MB</p>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-gray-800 text-xs text-gray-400 hover:bg-gray-700 transition-colors">
              Browse files
            </span>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}
