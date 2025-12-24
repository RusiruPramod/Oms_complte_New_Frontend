// src/services/inquiryService.ts
import request from "./api";

export interface InquiryData {
  message: string;
}

/**
 * Send a new inquiry to the backend
 * @param data - Inquiry message
 */
export const createInquiry = async (data: InquiryData) => {
  return request("inquiries", {
    method: "POST",
    body: data,
  });
};

/**
 * Fetch all inquiries (admin only)
 */
export const getAllInquiries = async (token: string) => {
  return request("inquiries", {
    method: "GET",
    token, // pass JWT token for protected route
  });
};
