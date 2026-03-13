import javax.swing.*;
import java.io.*;
import java.nio.file.*;
import java.util.regex.*;
import java.util.*;

public class PortfolioSync {
    private static final String DEST_PATH = "assets/images";

    public static void main(String[] args) {
        try {
            // 1. Set Look and Feel to System (Windows)
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());

            // 2. Open File Chooser
            JFileChooser chooser = new JFileChooser();
            chooser.setDialogTitle("Select Photos for Portfolio");
            chooser.setMultiSelectionEnabled(true);
            
            int result = chooser.showOpenDialog(null);
            if (result != JFileChooser.APPROVE_OPTION) {
                System.out.println("Upload cancelled.");
                return;
            }

            File[] selectedFiles = chooser.getSelectedFiles();
            
            // 3. Process each file
            for (File sourceFile : selectedFiles) {
                String nextName = getNextImageName();
                String ext = getFileExtension(sourceFile);
                File destFile = new File(DEST_PATH, nextName + "." + ext);

                // Create folder if missing
                new File(DEST_PATH).mkdirs();

                // Copy File
                Files.copy(sourceFile.toPath(), destFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
                System.out.println("Copied: " + sourceFile.getName() + " -> " + destFile.getName());
            }

            // 4. Git Sync
            System.out.println("Syncing to GitHub...");
            runCommand("git add .");
            runCommand("git commit -m \"Upload via Java Sync Tool\"");
            runCommand("git push");

            JOptionPane.showMessageDialog(null, "Successfully added " + selectedFiles.length + " photo(s) and synced to GitHub!");
            
        } catch (Exception e) {
            e.printStackTrace();
            JOptionPane.showMessageDialog(null, "Error: " + e.getMessage(), "Sync Failed", JOptionPane.ERROR_MESSAGE);
        }
    }

    private static String getNextImageName() {
        File dir = new File(DEST_PATH);
        if (!dir.exists()) return "Img1";

        File[] files = dir.listFiles();
        int max = 0;
        Pattern p = Pattern.compile("Img(\\d+)", Pattern.CASE_INSENSITIVE);

        if (files != null) {
            for (File f : files) {
                Matcher m = p.matcher(f.getName());
                if (m.find()) {
                    int num = Integer.parseInt(m.group(1));
                    if (num > max) max = num;
                }
            }
        }
        return "Img" + (max + 1);
    }

    private static String getFileExtension(File file) {
        String name = file.getName();
        int lastIndexOf = name.lastIndexOf(".");
        if (lastIndexOf == -1) return "jpg";
        return name.substring(lastIndexOf + 1);
    }

    private static void runCommand(String cmd) throws IOException, InterruptedException {
        ProcessBuilder builder = new ProcessBuilder("cmd.exe", "/c", cmd);
        builder.redirectErrorStream(true);
        Process p = builder.start();
        
        // Log output to console for debugging
        BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
        String line;
        while ((line = reader.readLine()) != null) {
            System.out.println("Git: " + line);
        }
        p.waitFor();
    }
}
