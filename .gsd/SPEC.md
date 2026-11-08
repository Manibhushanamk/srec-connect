# SREC Connect v3.0 — Specification

> **Status:** FINALIZED  
> **Institution:** Santhiram Engineering College, Nandyal (CSE - AI & ML)  
> **Source Document:** `SREC_Connect_Full_Project_Plan_for_Antigravity.pdf`  

## 1. System Vision
A production-ready academic community, portfolio platform, and department administration tool with an Instagram-style feed, LinkedIn-style credentials, and strict role-based operations.

## 2. Key Entities & Boundaries
- **5 Roles:** Super Admin, HOD, Web Manager, Faculty, Student.
- **Authentication:** Pre-provisioned Google OAuth only. University Roll Number is permanent unique identity anchor.
- **Storage Strategy:** Cloudflare R2 for images; Google Drive API for public certificates/PDFs; Private server store for confidential grievances and disciplinary records.
- **Zero AI Slop:** Handcrafted UI components with Tailwind CSS, shadcn/ui, and Lucide icons.
