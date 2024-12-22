// src/controllers/resourceController.ts

import { Request, Response, NextFunction } from 'express';
import {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
  acknowledgeResource,
  sendResourceToUser,
  getRelatedResources,
  getUserResources,
} from '../services/resourceService';
import { ResourceType } from '../models/Resource';
import mongoose from 'mongoose';


// Handler to Create a Resource
export const createResourceHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, type, content, images, tags } = req.body;

    if (!title || !type || !content) {
      res.status(400).json({ message: 'Title, Type, and Content are required.' });
      return;
    }

    if (!Object.values(ResourceType).includes(type)) {
      res.status(400).json({ message: 'Invalid Resource Type.' });
      return;
    }

    const resource = await createResource({
      title,
      type,
      content,
      images: images || [],
      tags: tags || [], // Include tags
      createdBy: req.user!._id,
    });

    res.status(201).json({ message: 'Resource created successfully.', resource });
  } catch (error: any) {
    next(error);
  }
};

export const acknowledgeResourceHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { resourceId, signature } = req.body;

    if (
      !resourceId ||
      !signature ||
      typeof signature.text !== 'string' ||
      typeof signature.font !== 'string' ||
      typeof signature.size !== 'string' ||
      typeof signature.color !== 'string'
    ) {
      res.status(400).json({
        message: 'Resource ID, signature text, font, size, and color are required.',
      });
      return;
    }

    console.log('Acknowledging resource:', resourceId);
    console.log('Signature:', signature);

    const acknowledgment = await acknowledgeResource(req.user._id.toString(), resourceId, signature);

    res.status(200).json({
      message: 'Acknowledgment recorded successfully.',
      acknowledgment,
    });
  } catch (err) {
    console.error('Error in acknowledgeResourceHandler:', err);
    res.status(400).json({ message: 'Cannot acknowledge resource' });
  }
};




// Send Resource to User
export const sendResourceToUserHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { resourceId, userIds } = req.body;

    // Validate input
    if (!resourceId || !userIds || !Array.isArray(userIds)) {
      res.status(400).json({ message: 'Invalid request parameters' });
      return;
    }

    const acknowledgments = [];
    const errors = [];

    // Loop through each userId and attempt to send the resource
    for (const userId of userIds) {
      try {
        const acknowledgment = await sendResourceToUser(resourceId, userId);
        acknowledgments.push(acknowledgment);
      } catch (err: any) {
        console.error(`Failed to send resource to user ${userId}:`, err);
        errors.push({ userId, error: err.message });
      }
    }

    // Respond based on success and errors
    if (errors.length > 0) {
      res.status(207).json({
        message: 'Resource sent to some users with errors.',
        acknowledgments,
        errors,
      });
      return;
    } else {
      res.status(201).json({
        message: 'Resource sent successfully to all users.',
        acknowledgments,
      });
      return;
    }
  } catch (err: any) {
    console.error('Error in sendResourceToUsersHandler:', err);
    res.status(500).json({ message: 'Cannot Send Resource', error: err.message });
    return;
  }
};

// Handler to Get Resources
export const getResourcesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, type, search, tags } = req.query;

    const resourcesData = await getResources({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      type: type as ResourceType,
      tags: tags ? (tags as string).split(',') : undefined, // Parse tags from query
      search: search as string,
    });

    res.status(200).json(resourcesData);
  } catch (error: any) {
    next(error);
  }
};

export const getRelatedResourcesHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resource = await getResourceById(id);
    if (!resource) {
      res.status(404).json({ message: 'Resource not found.' });
      return;
    }

    const relatedResources = await getRelatedResources(resource.tags, id);

    res.status(200).json({ relatedResources });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch related resources.', error: 'Cannot Fetch related Resources' });
  }
};



// Handler to Get Resource by ID
export const getResourceByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const resource = await getResourceById(id);
    if (!resource) {
      res.status(404).json({ message: 'Resource not found.' });
      return;
    }

    res.status(200).json(resource);
  } catch (error: any) {
    next(error);
  }
};

// Handler to Update a Resource
export const updateResourceHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, type, content, images, tags } = req.body;

    const updates = { title, type, content, images, tags }; // Include tags
    const updatedResource = await updateResource(id, updates);

    if (!updatedResource) {
      res.status(404).json({ message: 'Resource not found.' });
      return;
    }

    res.status(200).json({ message: 'Resource updated successfully.', resource: updatedResource });
  } catch (error: any) {
    next(error);
  }
};


// Handler to Delete a Resource
export const deleteResourceHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await deleteResource(id);
    res.status(200).json({ message: 'Resource deleted successfully.' });
  } catch (error: any) {
    next(error);
  }
};
export const getUserResourcesHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user || !mongoose.Types.ObjectId.isValid(req.user._id)) {
      res.status(400).json({ message: 'Invalid or missing User ID.' });
      return;
    }

    const resources = await getUserResources(req.user._id.toString());

    if (!resources.length) {
      res.status(404).json({ message: 'No resources found for this user.' });
      return;
    }

    res.status(200).json(resources);
  } catch (error) {
    console.error('Error fetching user resources:', error);
    res.status(500).json({ message: 'Failed to fetch user resources.' });
  }
};


