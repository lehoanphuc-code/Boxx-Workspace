using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Reflection;

namespace BoxxWorkspace
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string tempDir = Path.Combine(Path.GetTempPath(), "BoxxWorkspaceApp");
                string exePath = Path.Combine(tempDir, "Boxx Workspace.exe");

                Directory.CreateDirectory(tempDir);
                Assembly asm = Assembly.GetExecutingAssembly();
                using (Stream stream = asm.GetManifestResourceStream("payload.zip"))
                {
                    if (stream != null)
                    {
                        using (ZipArchive archive = new ZipArchive(stream))
                        {
                            foreach (ZipArchiveEntry entry in archive.Entries)
                            {
                                string destinationPath = Path.Combine(tempDir, entry.FullName);
                                if (string.IsNullOrEmpty(entry.Name))
                                {
                                    Directory.CreateDirectory(destinationPath);
                                }
                                else
                                {
                                    Directory.CreateDirectory(Path.GetDirectoryName(destinationPath));
                                    try
                                    {
                                        entry.ExtractToFile(destinationPath, overwrite: true);
                                    }
                                    catch
                                    {
                                        // Ignore locked active DLLs/EXEs if app is already open
                                    }
                                }
                            }
                        }
                    }
                }

                if (File.Exists(exePath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo(exePath);
                    psi.WorkingDirectory = tempDir;
                    Process.Start(psi);
                }
            }
            catch (Exception ex)
            {
                System.Windows.Forms.MessageBox.Show(
                    "Lỗi mở ứng dụng Boxx Workspace: " + ex.Message,
                    "Boxx Launcher Error",
                    System.Windows.Forms.MessageBoxButtons.OK,
                    System.Windows.Forms.MessageBoxIcon.Error
                );
            }
        }
    }
}
