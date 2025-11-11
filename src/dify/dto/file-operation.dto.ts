export class FileOperationDto {
  /**
   * 文件ID
   */
  file_id: string;

  /**
   * 用户标识
   */
  user: string;
}

export class FileUploadDto {
  /**
   * 文件对象
   */
  file: any; // 实际使用时应为文件类型

  /**
   * 用户标识
   */
  user: string;
}
