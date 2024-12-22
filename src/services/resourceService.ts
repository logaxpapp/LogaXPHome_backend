
// src/services/resourceService.ts

import Resource, { IResource, ResourceType, Tags } from '../models/Resource';
import mongoose from 'mongoose';
import ResourceAcknowledgment from '../models/ResourceAcknowledgment';
import { IResourceAcknowledgment } from '../models/ResourceAcknowledgment';
import { sendResourceNotification } from '../utils/email';


// Input Interfaces
interface CreateResourceInput {
  title: string;
  type: ResourceType;
  content: string;
  images?: string[]; // Image paths or URLs
  createdBy: mongoose.Types.ObjectId;
}

interface UpdateResourceInput {
  title?: string;
  type?: ResourceType;
  content?: string;
  images?: string[];
}

// Create a new Resource


  // Get Resources with Pagination and Filters
interface GetResourcesInput {
    page?: number;
    limit?: number;
    type?: ResourceType;
    search?: string;
    tags?: string[];
    sort?: string;
  }

  // Define the populated acknowledgment interface
interface IResourceAcknowledgmentPopulated extends Omit<IResourceAcknowledgment, 'resourceId'> {
  resourceId: IResource;
}


  export const createResource = async (data: {
    title: string;
    type: ResourceType;
    content: string;
    images: string[];
    createdBy: mongoose.Types.ObjectId;
    tags?: string[]; // Include tags
  }) => {
    return await new Resource(data).save();
  };
  
  
  export const getResources = async ({
    page = 1,
    limit = 10,
    type,
    tags,
    search,
    sort = '-createdAt',
  }: GetResourcesInput) => {
    const filters: any = {};
    if (type) filters.type = type;
    if (tags && tags.length > 0) filters.tags = { $in: tags }; // Filter by tags
    if (search) filters.title = { $regex: search, $options: 'i' };
  
    const total = await Resource.countDocuments(filters);
    const resources = await Resource.find(filters)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('createdBy', 'name');
  
    return { resources, total };
  };
  
  export const acknowledgeResource = async (
    userId: string,
    resourceId: string,
    signature: { text: string; font: string; size: string; color: string }
  ) => {
    console.log('Acknowledging resource:', resourceId);
    console.log('Signature:', signature);
  
    // Validate the resourceId
    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      throw new Error('Invalid Resource ID.');
    }
  
    // Ensure the resource exists
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      throw new Error('Resource not found.');
    }
  
    // Create or update the acknowledgment
    const acknowledgment = await ResourceAcknowledgment.findOneAndUpdate(
      { userId, resourceId }, // Match by user and resource
      {
        acknowledgedAt: new Date(),
        signature: signature.text,
        font: signature.font,
        size: signature.size,
        color: signature.color,
      },
      { upsert: true, new: true } // Create new if not found
    );
  
    return acknowledgment;
  };
  
  

  export const sendResourceToUser = async (resourceId: string, userId: string) => {
    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      throw new Error(`Invalid resourceId: ${resourceId}`);
    }
  
    // Verify that the resource exists
    const resourceExists = await Resource.exists({ _id: resourceId });
    if (!resourceExists) {
      throw new Error(`Resource with ID ${resourceId} does not exist.`);
    }
  
    // Check if acknowledgment already exists
    const existingAcknowledgment = await ResourceAcknowledgment.findOne({ resourceId, userId });
    if (existingAcknowledgment) {
      throw new Error(`Resource already sent to user ${userId}.`);
    }
  
    // Create new acknowledgment
    const acknowledgment = new ResourceAcknowledgment({ resourceId, userId });
    await acknowledgment.save();
  
    // Optionally, send notification or email to the user here
    await sendResourceNotification(userId, resourceId);
  
    return acknowledgment;
  };
  



// Get Resource by ID
export const getResourceById = async (id: string): Promise<IResource | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid Resource ID.' };
  }

  const resource = await Resource.findById(id).populate('createdBy', 'name email').exec();
  return resource;
};

// Update Resource
export const updateResource = async (
  id: string,
  updates: UpdateResourceInput & { tags?: string[] } // Include tags
): Promise<IResource | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid Resource ID.' };
  }

  const resource = await Resource.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate('createdBy', 'name email')
    .exec();
  return resource;
};

// Delete Resource
export const deleteResource = async (id: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid Resource ID.' };
  }

  const result = await Resource.findByIdAndDelete(id).exec();
  if (!result) {
    throw { status: 404, message: 'Resource not found.' };
  }
};

export const getRelatedResources = async (tags: Tags[], resourceId: string) => {
  return await Resource.find({ tags: { $in: tags }, _id: { $ne: resourceId } }) // Match tags as strings
    .limit(5)
    .populate('createdBy', 'name email');
};

function isPopulatedResource(
  resource: mongoose.Types.ObjectId | IResource
): resource is IResource {
  return typeof resource === 'object' && 'toObject' in resource;
}

export const getUserResources = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid User ID.');
  }

  try {
    // Fetch acknowledgments and populate associated resources
    const acknowledgments = await ResourceAcknowledgment.find({ userId })
      .populate<{ resourceId: IResource }>({
        path: 'resourceId',
        select: '_id title type content images tags createdAt createdBy',
      })
      .exec();

    // Filter and map the data to include all fields
    const validResources = acknowledgments
      .filter((ack) => ack.resourceId && ack.resourceId._id) // Ensure resourceId is populated
      .map((ack) => ({
        ...ack.resourceId.toObject(),
        acknowledgedAt: ack.acknowledgedAt,
        signature: ack.signature, // Include acknowledgment fields
        font: ack.font,
        size: ack.size,
        color: ack.color,
      }));

    return validResources;
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};
