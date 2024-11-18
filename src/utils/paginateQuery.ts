import { PaginationMetadata } from '../types/paginate';

export const paginateQuery = async (
    model: any,
    query: any,
    page: number,
    limit: number,
    populateOptions?: any
  ): Promise<{ data: any[]; pagination: PaginationMetadata }> => {
    const totalItems = await model.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;
  
    let queryBuilder = model.find(query).skip(skip).limit(limit);
  
    if (populateOptions) {
      queryBuilder = queryBuilder.populate(populateOptions);
    }
  
    const data = await queryBuilder.lean();
  
    return {
      data,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
      },
    };
  };
  