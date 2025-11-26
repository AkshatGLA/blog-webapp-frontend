import React, { useEffect, useState } from "react";
import BlogCard from "@/components/BlogCard";
import LMS from "../assets/LMS.png";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setBlog } from "@/redux/blogSlice";

export const blogJson = [
  { id: 1, title: "The Ultimate Guide...", image: LMS, /*...*/ },
  /* your seed items (shortened for clarity) */
];

const Blog = () => {
  const dispatch = useDispatch();
  const { blog } = useSelector((store) => store.blog);
  const { user } = useSelector((s) => s.auth);
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";
  const GET_PUBLISHED = import.meta.env.VITE_GET_PUBLISHED_VLOGS_URL || "/blog/get-published-blogs";
  const GET_OWN = import.meta.env.VITE_GET_OWN_BLOGS || "/blog/get-own-blogs";
  const VLOG_VIEW = import.meta.env.VITE_VLOG_VIEW || "/blog";

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        // always request published blogs
        const publishedPromise = axios.get(`${API_BASE}${GET_PUBLISHED}`, {
          withCredentials: true,
        });

        // If user is logged in, also fetch their own blogs (might include drafts)
        const ownPromise = user
          ? axios.get(`${API_BASE}${GET_OWN}`, { withCredentials: true })
          : Promise.resolve({ data: { success: false, blogs: [] } });

        const [publishedRes, ownRes] = await Promise.all([publishedPromise, ownPromise]);

        const published = Array.isArray(publishedRes?.data?.blogs) ? publishedRes.data.blogs : [];
        const own = Array.isArray(ownRes?.data?.blogs) ? ownRes.data.blogs : [];

        // Merge + dedupe by _id (or id)
        const map = new Map();
        [...published, ...own].forEach((b) => {
          const id = b._id || b.id;
          if (!id) return;
          // keep the more recent object (own overrides published if same id)
          map.set(id, { ...(map.get(id) || {}), ...b });
        });
        const merged = Array.from(map.values());

        if (merged.length > 0) {
          dispatch(setBlog(merged));
        } else {
          // if no results, fallback to seed data (optional)
          dispatch(setBlog(blogJson));
        }
      } catch (err) {
        console.error("Error fetching blogs:", err);
        // fallback to seed on error
        dispatch(setBlog(blogJson));
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, user]); // refetch when user changes (so user-created posts appear)

  return (
    <div className="pt-16">
      <div className="max-w-6xl mx-auto text-center flex flex-col space-y-4 items-center">
        <h1 className="text-4xl font-bold text-center pt-10 ">Our Blogs</h1>
        <hr className=" w-24 text-center border-2 border-red-500 rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto grid gap-10 grid-cols-1 md:grid-cols-3 py-10 px-4 md:px-0">
        {loading ? (
          <div className="col-span-3 text-center">Loading blogs...</div>
        ) : (
          (blog && blog.length ? blog : blogJson).map((blogItem, index) => {
            const id = blogItem._id || blogItem.id || index;
            const vlogView = `${VLOG_VIEW}/${id}`;
            return <BlogCard blog={blogItem} key={id} vlogView={vlogView} />;
          })
        )}
      </div>
    </div>
  );
};

export default Blog;
