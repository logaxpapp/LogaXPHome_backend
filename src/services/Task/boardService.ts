// /src/services/Task/boardService.ts

import mongoose from 'mongoose';
import Board, { IBoard } from '../../models/Task/Board';
import List, { IList } from '../../models/Task/List';
import Team, { ITeam } from '../../models/Team';
import { IUser } from '../../models/User';

/** Input for creating a new Board */
interface CreateBoardInput {
  name: string;
  description?: string;
  owner: IUser | mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId | ITeam;
}

/** Input for updating an existing Board */
interface UpdateBoardInput {
  name?: string;
  description?: string;
  team?: mongoose.Types.ObjectId | ITeam;
}
export const createBoard = async (input: CreateBoardInput): Promise<IBoard> => {
  const team = await Team.findById(input.team);
  if (!team) {
    throw new Error('Team not found');
  }

  const isOwnerUser = (owner: IUser | mongoose.Types.ObjectId): owner is IUser => {
    return (owner as IUser).role !== undefined;
  };

  const isOwnerMember = team.members.some(
    (member) => member.user.toString() === input.owner._id.toString()
  );

  const isAdmin = isOwnerUser(input.owner) && input.owner.role === 'admin';

  if (!isOwnerMember && !isAdmin) {
    throw new Error('Owner must be a member of the team');
  }

  if (!isOwnerMember) {
    team.members.push({
      user: input.owner._id,
      role: 'Leader',
    });
    await team.save();
  }

  const board = new Board({
    name: input.name,
    description: input.description,
    owner: input.owner._id,
    team: input.team,
    members: [input.owner._id],
  });

  await board.save();

  const defaultHeaders = ['Backlog', 'Pending', 'In Progress', 'Review', 'Closed'];

  // Adjust List creation to include `header` field
  const lists = await Promise.all(
    defaultHeaders.map(async (header, index) => {
      const list = new List({
        name: header, // Optional: Keeping `name` if required elsewhere
        header, // Providing `header` as required by the List model
        board: board._id,
        position: index,
      });
      await list.save();
      return list._id as mongoose.Types.ObjectId;
    })
  );

  board.lists = lists;
  await board.save();

  return board;
};

/**
 * Fetch a Board by ID, populating team/members/lists/cards, and ensuring lists include board details
 */
export const getBoardById = async (boardId: string): Promise<IBoard | null> => {
  return Board.findById(boardId)
    .populate({
      path: 'team',
      select: 'name description members',
      populate: {
        path: 'members.user',
        select: 'name email role',
      },
    })
    .populate({
      path: 'lists',
      populate: [
        {
          path: 'cards',
          populate: [
            {
              path: 'assignees',
              select: 'name email',
            },
            {
              path: 'attachments', // Populate attachments
              select: 'filename url',
            },
          ],
        },
        {
          path: 'board', // Populate board details for each list
          select: 'name description headers team',
        },
      ],
    })
    .populate('labels')
    
    .exec();
};



/**
 * Update a Board
 */
export const updateBoard = async (
  boardId: string,
  updates: UpdateBoardInput
): Promise<IBoard | null> => {
  // If updating the team, ensure the new team exists
  if (updates.team) {
    const team = await Team.findById(updates.team);
    if (!team) {
      throw new Error('New team not found');
    }
  }

  const updatedBoard = await Board.findByIdAndUpdate(boardId, updates, { new: true })
    .populate({
      path: 'team',
      select: 'name description members',
      populate: {
        path: 'members.user',
        select: 'name email role',
      },
    })
    .populate({
      path: 'lists',
      populate: {
        path: 'cards',
        populate: {
          path: 'assignees',
          select: 'name email',
        },
      },
    })
    .populate('labels')
    .exec();

  return updatedBoard;
};

/**
 * Delete a Board (triggers pre-deleteOne hook for cascading deletes)
 */
export const deleteBoard = async (boardId: string): Promise<void> => {
  const board = await Board.findById(boardId);
  if (!board) {
    throw new Error('Board not found');
  }
  // This triggers the pre('deleteOne') hook in Board model
  await board.deleteOne();
};

/**
 * Update the list order of a Board
 */
export const updateBoardLists = async (
  boardId: string,
  lists: string[]
): Promise<IBoard | null> => {
  // Optionally ensure the lists belong to this board
  const updatedBoard = await Board.findByIdAndUpdate(
    boardId,
    { lists },
    { new: true }
  )
    .populate('lists')
    .populate('team')
    .populate('members')
    .exec();

  return updatedBoard;
};


