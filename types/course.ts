export interface Course {
  id: number;
  course_name: string;
  description: string;
  image: string;
  price: number;
  price_without_discount: number;
  category: string;
  language: string;
  duration: string;
  rating: number;
  course_type: string;
  sections: string[];
}
