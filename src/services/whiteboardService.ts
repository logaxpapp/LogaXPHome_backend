import mongoose from 'mongoose';
import Whiteboard, { IWhiteboard } from '../models/Whiteboard';
import User from '../models/User';
import { IUser } from '../models/User';

/**
 * Create a new whiteboard
 */
export const createWhiteboard = async (
  ownerId: string,
  title: string,
  description?: string
): Promise<IWhiteboard> => {
  const owner = await User.findById(ownerId);
  if (!owner) {
    throw new Error('Owner user not found');
  }

  const whiteboard = new Whiteboard({
    owner: owner._id,
    title,
    description: description || '',
    participants: [],
    strokes: [],
    snapshots: [],
    version: 0,
  });

  await whiteboard.save();
  return whiteboard;
};

/**
 * Get a single whiteboard by ID
 */
export const getWhiteboardById = async (
  whiteboardId: string
): Promise<IWhiteboard | null> => {
  const wb = await Whiteboard.findById(whiteboardId)
    .populate('owner', 'name email')
    .populate('participants', 'name email')
    .lean(); // returns a plain JS object
  return wb as IWhiteboard;
};

/**
 * Update whiteboard strokes, optionally creating a snapshot
 */
export const updateWhiteboard = async (
  whiteboardId: string,
  strokes: any[],
  createSnapshot?: boolean
): Promise<IWhiteboard | null> => {
  const wb = await Whiteboard.findById(whiteboardId);
  if (!wb) {
    throw new Error('Whiteboard not found');
  }

  wb.strokes = strokes; // Overwrite strokes

  // If we want to create a snapshot
  if (createSnapshot) {
    wb.snapshots.push({
      createdAt: new Date(),
      content: strokes,
      version: wb.version + 1, // We'll store the *next* version
    });
  }

  // `.save()` triggers the pre-save hook, which increments `version` if strokes changed
  await wb.save();
  return wb;
};

/**
 * Add a participant
 */
export const addParticipant = async (
  whiteboardId: string,
  userId: string
): Promise<IWhiteboard | null> => {
  const wb = await Whiteboard.findById(whiteboardId);
  if (!wb) {
    throw new Error('Whiteboard not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Only add if they're not already in participants
  if (!wb.participants.includes(user._id)) {
    wb.participants.push(user._id);
    await wb.save();
  }
  return wb;
};

/**
 * Remove a participant
 */
export const removeParticipant = async (
  whiteboardId: string,
  userId: string
): Promise<IWhiteboard | null> => {
  const wb = await Whiteboard.findById(whiteboardId);
  if (!wb) {
    throw new Error('Whiteboard not found');
  }

  wb.participants = wb.participants.filter((p) => p.toString() !== userId);
  await wb.save();
  return wb;
};

/**
 * Revert to a specific snapshot
 */
export const revertToSnapshot = async (
  whiteboardId: string,
  snapshotId: string
): Promise<IWhiteboard | null> => {
  const wb = await Whiteboard.findById(whiteboardId);
  if (!wb) {
    throw new Error('Whiteboard not found');
  }

  const snapshot = wb.snapshots.find((s) => s._id?.toString() === snapshotId);
  if (!snapshot) {
    throw new Error('Snapshot not found');
  }

  // Overwrite current strokes & version
  wb.strokes = snapshot.content;
  wb.version = snapshot.version;

  await wb.save();
  return wb;
};

/**
 * Delete a whiteboard
 */
export const deleteWhiteboard = async (whiteboardId: string): Promise<void> => {
  await Whiteboard.findByIdAndDelete(whiteboardId);
};
