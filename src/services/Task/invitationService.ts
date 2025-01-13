import crypto from 'crypto';
import Invitation, { IInvitation } from '../../models/Task/Invitation';
import User, { IUser } from '../../models/User';
import Board, { IBoard } from '../../models/Task/Board';
import { UserRole, UserStatus } from '../../types/enums';
import mongoose from 'mongoose';

/**
 * Generates a random ID if a user doesn't have an employee_id.
 */
function generateSomeUniqueId(): string {
  const randInt = Math.floor(Math.random() * 100000);
  return `INVITE-${randInt}`;
}

/**
 * Creates a new board invitation.
 * - If the inviter is Contractor/SubContractor, we force invitedRole = 'subContractor'.
 * - If the inviter is Admin, they can set any role (e.g. 'admin', 'contractor', 'user', etc.).
 */
export const createBoardInvitation = async (
  boardId: string,
  invitedEmail: string,
  invitedRole: UserRole,  // e.g. 'admin', 'contractor', 'subContractor'
  invitedBy: IUser
): Promise<IInvitation> => {
  // 1) If inviter is Contractor or SubContractor, force subContractor
  if (invitedBy.role === UserRole.Contractor || invitedBy.role === UserRole.SubContractor) {
    invitedRole = UserRole.SubContractor;
  } else if (invitedBy.role !== UserRole.Admin) {
    // Normal user not allowed to invite
    throw new Error('Only Admins or Contractors can invite new members to a board.');
  }

  // 2) Ensure the board exists
  const board = await Board.findById(boardId);
  if (!board) {
    throw new Error('Board not found.');
  }

  // 3) Generate an invite token
  const inviteToken = crypto.randomBytes(20).toString('hex');

  // 4) Create and save the Invitation
  const invite = new Invitation({
    board: board._id,
    invitedEmail: invitedEmail.toLowerCase(),
    invitedBy: invitedBy._id,
    role: invitedRole,
    inviteToken,
    status: 'pending',
  });

  await invite.save();
  return invite;
};

/**
 * Accepts a pending board invitation.
 * - If no existing user, creates one (sets Active & possibly manager).
 * - If user exists, optionally sets user Active (doesn't override role unless you want to).
 * - Ensures user has an employee_id.
 * - Adds user to board.members.
 * - Marks invite as accepted.
 */
export const acceptBoardInvitation = async (
  inviteToken: string,
  newUserName?: string,
  newUserPassword?: string
): Promise<{ board: IBoard; user: IUser }> => {
  // 1) Fetch the pending invitation
  const invite = await Invitation.findOne({ inviteToken, status: 'pending' }).populate('invitedBy');
  if (!invite) {
    throw new Error('Invalid or expired invitation token.');
  }

  // 2) Check if user with invitedEmail already exists
  let user = await User.findOne({ email: invite.invitedEmail });

  // 3) If no user => create them
  if (!user) {
    if (!newUserName || !newUserPassword) {
      throw new Error('No user found. Provide name/password to create a new user.');
    }

    user = new User({
      name: newUserName,
      email: invite.invitedEmail,
      password_hash: newUserPassword,
      role: invite.role,           // e.g. subContractor
      status: UserStatus.Active,   // new user is Active immediately
    });

    // If the resulting role is subContractor, set manager
    if (invite.role === UserRole.SubContractor) {
      const inviter = invite.invitedBy as IUser;
      user.manager = inviter._id;  // so we know the contractor/subContractor that invited them
    }

    await user.save();
  } else {
    // If user already exists, optionally set them active
    if (user.status !== UserStatus.Active) {
      user.status = UserStatus.Active;
    }
    // We do not override role if the user has a different role.
    await user.save();
  }

  // 4) Ensure user.employee_id is set
  if (!user.employee_id) {
    user.employee_id = generateSomeUniqueId();
    await user.save();
  }

  // 5) Add user to the board
  const board = await Board.findById(invite.board);
  if (!board) {
    throw new Error('Board not found.');
  }
  const alreadyInBoard = board.members.some((m) => m.toString() === user._id.toString());
  if (!alreadyInBoard) {
    board.members.push(user._id);
    await board.save();
  }

  // 6) Mark invitation as accepted
  invite.status = 'accepted';
  await invite.save();

  return { board, user };
};

/**
 * Declines a pending invitation by token (optional).
 */
export async function declineBoardInvitation(
  inviteToken: string,
  reason?: string
): Promise<IInvitation> {
  const invite = await Invitation.findOne({ inviteToken, status: 'pending' });
  if (!invite) {
    throw new Error('Invalid, expired, or non-pending invitation token.');
  }

  invite.status = 'declined';
  // Optionally store reason if your schema has a field for it:
  // invite.declineReason = reason || '';

  await invite.save();
  return invite;
}
