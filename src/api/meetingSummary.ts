// src/api/meetingSummary.ts
import { db } from '@/services/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import type { MeetingSummaryData, MeetingSummaryPayload } from '@/types/meetingSummary';

const COLLECTION_NAME = 'LIMMeetingSummaries';

// Firestore Collection Reference
const meetingSummariesCollection = collection(db, COLLECTION_NAME);

// ฟังก์ชันที่ดึงข้อมูล meeting summaries
export const getAllMeetingSummaries = async (): Promise<MeetingSummaryData[]> => {
  try {
    const meetingSummariesSnapshot = await getDocs(meetingSummariesCollection);
    const meetingSummaries: MeetingSummaryData[] = [];
    meetingSummariesSnapshot.forEach((doc) => {
      meetingSummaries.push({
        id: doc.id,
        ...doc.data(),
      } as MeetingSummaryData);
    });
    return meetingSummaries;
  } catch (err) {
    console.error('Error fetching meeting summaries:', err);
    throw new Error('Error fetching meeting summaries');
  }
};

// Create a new meeting summary
export const createMeetingSummary = async (payload: MeetingSummaryPayload): Promise<void> => {
  try {
    if (!payload.meetingDate) {
      throw new Error('Meeting date is required');
    }
    await addDoc(meetingSummariesCollection, payload);
  } catch (err) {
    console.error('Error details:', err); // แสดง error เต็มๆ
    throw new Error('Error creating meeting summary');
  }
};

// Update an existing meeting summary by ID
export const updateMeetingSummaryById = async (id: string, payload: MeetingSummaryPayload): Promise<void> => {
  try {
    const meetingSummaryRef = doc(db, COLLECTION_NAME, id);
    
    // แปลง payload สำหรับ updateDoc
    const updateData = {
      meetingDate: payload.meetingDate,
      meetingNo: payload.meetingNo,
      meetingTime: payload.meetingTime,
      attendees: payload.attendees || null,
      meetingTopic: payload.meetingTopic || null,
      meetingChannel: payload.meetingChannel || null,
      meetingPlace: payload.meetingPlace || null,
      noteTaker: payload.noteTaker || null,
      remark: payload.remark || null,
      files: payload.files || [],
      createdBy: payload.createdBy
    };
    
    await updateDoc(meetingSummaryRef, updateData);
  } catch (err) {
    console.error('Error updating meeting summary:', err);
    throw new Error(`Error updating meeting summary: ${err instanceof Error ? err.message : String(err)}`);
  }
};

// Delete a meeting summary by ID
export const deleteMeetingSummaryById = async (id: string): Promise<void> => {
  try {
    const meetingSummaryRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(meetingSummaryRef);
  } catch (err) {
    console.error('Error deleting meeting summary:', err);
    throw new Error('Error deleting meeting summary');
  }
};

// Fetch unique meeting topics (could be expanded to any other filters)
export const getUniqueMeetingTopics = async (): Promise<string[]> => {
  try {
    const q = query(meetingSummariesCollection, where('meetingTopic', '!=', ''));
    const snapshot = await getDocs(q);
    const topics: string[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.meetingTopic && !topics.includes(data.meetingTopic)) {
        topics.push(data.meetingTopic);
      }
    });
    return topics;
  } catch (err) {
    console.error('Error fetching unique meeting topics:', err);
    throw new Error('Error fetching unique meeting topics');
  }
};
