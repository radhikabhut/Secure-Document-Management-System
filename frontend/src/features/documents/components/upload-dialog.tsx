import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, X } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  getDocumentErrorMessage,
  uploadDocument,
  
} from "@/features/documents/api";
import {
  uploadDocumentSchema,
  type UploadDocumentFormValues,
} from "@/features/documents/schemas";

interface UploadDialogProps {
  categories: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onUploaded: () => void;
}

const maxFileSize = 50 * 1024 * 1024;

export function UploadDialog({
  categories,
  isOpen,
  onClose,
  onUploaded,
}: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const {
  formState: { errors },
  handleSubmit,
  register,
  reset,
  setError,
} = useForm<UploadDocumentFormValues>({
  resolver: zodResolver(uploadDocumentSchema),
  defaultValues: {
    title: "",
    categoryId: categories[0]?.id ?? "",
  },
});

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    maxFiles: 1,
    maxSize: maxFileSize,
    multiple: false,
    onDrop: (acceptedFiles, rejectedFiles) => {
      setFileError(null);

      if (rejectedFiles[0]) {
        setSelectedFile(null);
        setFileError(
          rejectedFiles[0].errors[0]?.message ??
            "Select a valid document file.",
        );
        return;
      }

      setSelectedFile(acceptedFiles[0] ?? null);
    },
  });

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    if (isUploading) {
      return;
    }

    reset();
    setSelectedFile(null);
    setFileError(null);
    setUploadProgress(0);
    onClose();
  };

const onSubmit = async (values: UploadDocumentFormValues) => {
  const payload = {
    file: selectedFile!,
    title: values.title.trim(),
    categoryId: values.categoryId ?? "",
  };

  setUploadProgress(0);
  setIsUploading(true);

  try {
    await uploadDocument(payload);

    toast.success("Document uploaded successfully");
    onUploaded();
    handleClose();
  } catch (error) {
    const message = getDocumentErrorMessage(error);

    setError("root", { message });
    toast.error(message);
  } finally {
    setIsUploading(false);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        aria-label="Close upload dialog"
        className="absolute inset-0 bg-slate-950/40"
        type="button"
        onClick={handleClose}
      />
      <section className="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Upload document
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Add a secure file to the document vault.
            </p>
          </div>
          <button
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            disabled={isUploading}
            type="button"
            onClick={handleClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form className="space-y-4 p-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="title"
            >
              Title
            </label>
            <input
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="title"
              type="text"
              {...register("title")}
            />
            {errors.title ? (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="categoryId"
            >
              Category
            </label>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              id="categoryId"
              {...register("categoryId")}
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div
            {...getRootProps({
              className: [
                "flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-5 py-6 text-center transition",
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-slate-50 hover:bg-slate-100",
              ].join(" "),
            })}
          >
            <input {...getInputProps()} />
            <FileUp className="h-8 w-8 text-slate-500" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-800">
              {selectedFile ? selectedFile.name : "Drop a file here or browse"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Maximum file size: 50 MB
            </p>
          </div>

          {fileError ? (
            <p className="text-sm text-red-600">{fileError}</p>
          ) : null}

          {isUploading ? (
            <div className="space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-700 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {uploadProgress}% uploaded
              </p>
            </div>
          ) : null}

          {errors.root?.message ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.root.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isUploading}
              type="button"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              className="h-10 rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isUploading}
              type="submit"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
