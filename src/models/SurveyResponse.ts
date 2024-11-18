// src/models/SurveyResponse.ts

import mongoose, { Document, Schema, Model } from 'mongoose';
import { ISurveyAssignment } from './SurveyAssignment';
import { IQuestion } from './Question';

export interface IResponse {
  question_id: mongoose.Types.ObjectId | IQuestion; // Update to support populated question
  response_text: string | string[] | number;
}

export interface ISurveyResponse extends Document {
  survey_assignment: mongoose.Types.ObjectId | ISurveyAssignment;
  responses: IResponse[];
}

const ResponseSchema: Schema<IResponse> = new Schema(
  {
    question_id: { type: Schema.Types.ObjectId, ref: 'Question', required: true }, // Reference 'Question' here
    response_text: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const SurveyResponseSchema: Schema<ISurveyResponse> = new Schema(
  {
    survey_assignment: { type: mongoose.Types.ObjectId, ref: 'SurveyAssignment', required: true },
    responses: { type: [ResponseSchema], required: true },
  },
  { timestamps: true }
);

const SurveyResponse: Model<ISurveyResponse> = mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);
export default SurveyResponse;
