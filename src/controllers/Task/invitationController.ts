import { Request, Response, NextFunction, RequestHandler } from 'express';
import { IUser } from '../../models/User';
import { createBoardInvitation, acceptBoardInvitation, declineBoardInvitation, } from '../../services/Task/invitationService';
import { UserRole } from '../../types/enums';
import { sendBoardInvitationEmail } from '../../utils/email';
import Board from '../../models/Task/Board';

// If you already have this in a global file, remove these lines:
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * POST /api/invitations
 * Body: { boardId, invitedEmail, role }
 *
 * This is how a Contractor or Admin can invite a new (or existing) user by email.
 */
export const createInvitationHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1) Must have a logged-in user
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const { boardId, invitedEmail, role } = req.body;

    // 2) Create a new invitation in your system
    const invitation = await createBoardInvitation(boardId, invitedEmail, role, req.user);

    // (Optional) If you want to show an acceptance link in the JSON response:
    const inviteLink = `${FRONTEND_URL}/invite/accept?token=${invitation.inviteToken}`;

    // 3) If you want to show the board’s name in the email, you can fetch it now:
   
    const boardDoc = await Board.findById(boardId).select('name');
    const boardName = boardDoc?.name || 'Untitled Board';

    // 4) Send an email to the invited email with the link (use the above boardName if fetched)
    // If you haven’t fetched the board name, just pass a default string:
    await sendBoardInvitationEmail(invitedEmail, invitation.inviteToken, boardName || 'Untitled Board');

    res.status(201).json({
      message: 'Invitation created. An email has been sent to the invitee.',
      invitation,
      inviteLink, // optional
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/invitations/accept
 * Body: { token, name?, password? }
 * If user doesn’t exist, supply name/password. If user already exists, name/password can be ignored.
 */
export const acceptInvitationHandler: RequestHandler = async (req, res, next) => {
  try {
    const { token, name, password } = req.body;

    const { board, user } = await acceptBoardInvitation(token, name, password);

    res.status(200).json({
      message: 'Invitation accepted. Welcome to the board!',
      boardId: board._id,
      userId: user._id,
    });
  } catch (err) {
    next(err);
  }
};


export const declineInvitationHandler: RequestHandler = async (req, res, next) => {
  try {
    const { token, reason } = req.body;

    const invite = await declineBoardInvitation(token, reason);

    res.status(200).json({
      message: 'Invitation declined successfully.',
      invitationId: invite._id,
      status: invite.status,
    });
  } catch (err) {
    next(err);
  }
};