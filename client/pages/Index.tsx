import { useState, useCallback, useRef } from "react";
import mammoth from "mammoth";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content: string;
}

export default function Index() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === "text/plain") {
      return await file.text();
    } else if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } else {
      throw new Error(
        "Unsupported file type. Please upload a .txt or .docx file.",
      );
    }
  };

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const content = await extractTextFromFile(file);
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        content,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      setError("File is too large. Please select a file smaller than 10MB.");
      return;
    }

    const allowedTypes = [
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const isValidType =
      allowedTypes.includes(file.type) ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".docx");

    if (!isValidType) {
      setError("Invalid file type. Please upload a .txt or .docx file.");
      return;
    }

    processFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
    },
    [handleFileSelect],
  );

  const resetUpload = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen gradient-aurora relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-xl floating"></div>
        <div
          className="absolute top-1/3 right-20 w-24 h-24 bg-pink-300 rounded-full blur-lg floating"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-40 h-40 bg-blue-300 rounded-full blur-2xl floating"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 text-shadow-soft">
            Text Extractor
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Upload your text or Word documents and see them beautifully
            displayed with modern typography
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-4xl mx-auto w-full">
          {!uploadedFile ? (
            <div className="space-y-8">
              {/* Upload Area */}
              <div
                className={`
                  relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
                  glass-morphism hover:glass-morphism-dark
                  ${
                    isDragOver
                      ? "border-white/60 bg-white/20 scale-105"
                      : "border-white/30 hover:border-white/50"
                  }
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.docx"
                  onChange={handleInputChange}
                  className="hidden"
                />

                {isLoading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <p className="text-white text-lg">
                      Processing your file...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                      <Upload className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-2">
                        Drop your file here or click to browse
                      </h3>
                      <p className="text-white/80">
                        Supports .txt and .docx files up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-3 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                {[
                  {
                    icon: <FileText className="w-8 h-8" />,
                    title: "Multiple Formats",
                    description:
                      "Support for .txt and .docx files with accurate text extraction",
                  },
                  {
                    icon: <CheckCircle className="w-8 h-8" />,
                    title: "Fast Processing",
                    description:
                      "Instant text extraction with beautiful formatting and display",
                  },
                  {
                    icon: <Upload className="w-8 h-8" />,
                    title: "Drag & Drop",
                    description:
                      "Simple drag and drop interface or click to browse files",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="text-center p-6 glass-morphism rounded-xl"
                  >
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-white/80">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info Header */}
              <div className="flex items-center justify-between p-6 glass-morphism rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {uploadedFile.name}
                    </h3>
                    <p className="text-white/70">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetUpload}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Extracted Text */}
              <div className="glass-morphism rounded-xl p-8">
                <h2 className="text-2xl font-semibold text-white mb-6">
                  Extracted Text
                </h2>
                <div className="bg-white/10 rounded-lg p-6 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-white/90 font-mono leading-relaxed">
                    {uploadedFile.content ||
                      "No text content found in the file."}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={resetUpload}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Upload Another File
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(uploadedFile.content);
                  }}
                  className="flex-1 bg-white text-purple-600 hover:bg-white/90 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Copy Text
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
