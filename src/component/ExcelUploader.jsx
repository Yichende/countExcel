// 文件上传组件
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";

const ExcelUploader = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [error, setError] = useState('');

  // 使用 react-dropzone 进行文件拖放处理
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], // Excel 2007+ (.xlsx)
      'application/vnd.ms-excel': ['.xls'], // Excel 2003 and earlier (.xls)
    },  // 限制文件类型
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        // 上传的文件不符合
        setError("只能上传Excel类文件 (.xlsx, .xls)");
        setOpenSnackbar(true);
      } else {
        setError("");
        setFile(acceptedFiles[0]); // 获取拖放的文件
        setIsUploading(true);
        // 模拟上传
        setTimeout(() => {
          setIsUploading(false);
          alert("文件上传成功");
        }, 2000); // 2秒钟后模拟文件上传成功
      }
    },
  });
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5">
      <Paper
        {...getRootProps()}
        sx={{
          width: "30vw",
          padding: "40px",
          textAlign: "center",
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: file ? "#e0ffe0" : "#fff",
          border: "2px dashed #1976d2",
          cursor: "pointer",
          transition: "all 0.3s ease",
          ":hover": { borderColor: "#1565c0" },
        }}>
        <input {...getInputProps()} />
        <Typography
          variant="h6"
          color="textSecondary"
          gutterBottom>
          拖放文件或点击选择文件
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          mb={2}>
          支持 xls, xlsx 格式的文件
        </Typography>

        {isUploading ? (
          <CircularProgress />
        ) : file ? (
          <Box>
            <Typography
              variant="body1"
              color="primary">
              文件名: {file.name}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary">
              文件大小: {(file.size / 1024).toFixed(2)} KB
            </Typography>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary">
            选择文件
          </Button>
        )}
      </Paper>
      {/* 错误提示的 Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}>
        <Alert
          onClose={handleCloseSnackbar}
          severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExcelUploader;
