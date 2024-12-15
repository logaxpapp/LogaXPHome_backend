import { Request, Response } from 'express';
import Group from '../models/Group';
import User, { IUser } from '../models/User';
import mongoose from 'mongoose';
import { io } from '../app';
interface AuthenticatedRequest extends Request {
  user?: IUser;
}


export const createGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id; // Ensure user is authenticated
    const { name, members }: { name: string; members?: string[] } = req.body; // Explicitly typed

    if (!name) {
      res.status(400).json({ message: 'Group name is required' });
      return;
    }

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (members && !Array.isArray(members)) {
      res.status(400).json({ message: '`members` should be an array of strings.' });
      return;
    }

    // Include the creator as a member by default
    const group = new Group({
      name,
      members: members ? [userId, ...members] : [userId], // Include creator
      createdBy: userId,
    });

    await group.save(); // Save once

    // Notify invited members
    members?.forEach((memberId: string) => {
      io.to(memberId.toString()).emit('group_invitation', {
        groupId: group._id,
        groupName: group.name,
      });
    });

    res.status(201).json({ data: group });
  } catch (error: any) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};



export const addMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    if (!group.members.includes(memberId)) {
      group.members.push(memberId);
      await group.save();
    }

    res.status(200).json({ data: group });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const removeMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId, memberId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    group.members = group.members.filter(
      (member) => member.toString() !== memberId
    );

    await group.save();

    res.status(200).json({ data: group });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const getGroupDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate('members', 'name email');

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    res.status(200).json({ data: group });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};


export const getUserGroups = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 10, search = '' } = req.query;
    console.log()
    const searchQuery = {
      members: userId,
      ...(search && { name: { $regex: search, $options: 'i' } }), // Filter by group name (case-insensitive)
    };

    const skip = (Number(page) - 1) * Number(limit);
    const groups = await Group.find(searchQuery)
      .populate('members', 'name email')
      .skip(skip)
      .limit(Number(limit));

    const total = await Group.countDocuments(searchQuery);

    res.status(200).json({
      data: groups,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};


export const updateGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { name, members }: { name?: string; members?: string[] } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    if (name) group.name = name;

    if (members) {
      // Convert members to ObjectId before assigning
      const objectIdMembers = members.map((member) => new mongoose.Types.ObjectId(member));
      group.members = objectIdMembers;
    }

    await group.save();

    res.status(200).json({ data: group });
  } catch (error: any) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({ message: 'Group not found' });
      return;
    }

    await group.deleteOne();

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
