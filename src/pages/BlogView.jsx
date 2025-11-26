import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, MessageSquare, Share2 } from "lucide-react";
import CommentBox from "@/components/CommentBox";
import axios from "axios";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { setBlog } from "@/redux/blogSlice";
import { toast } from "sonner";

/**
 * BlogView - displays a single blog post.
 * Requires Vite env vars:
 *   VITE_BASE_URL      e.g. https://api.example.com/api/v1
 *   VITE_VLOG_VIEW     e.g. /blog
 */

const BlogView = () => {
  const params = useParams();
  const blogId = params.blogId;
  const dispatch = useDispatch();

  // Redux state
  const { blog } = useSelector((store) => store.blog);
  const { user } = useSelector((store) => store.auth);
  const { comment } = useSelector((store) => store.comment);

  // Env vars (fallbacks provided)
  const API_BASE = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";
  const VLOG_VIEW = import.meta.env.VITE_VLOG_VIEW || "/blogs";

  // Find selected blog from redux store
  const selectedBlog = blog?.find((b) => b._id === blogId || b.id === blogId);

  // Local UI state
  const [blogLike, setBlogLike] = useState(selectedBlog?.likes?.length || 0);
  const [liked, setLiked] = useState(
    Boolean(selectedBlog?.likes?.includes(user?._id))
  );
  const [loadingLike, setLoadingLike] = useState(false);

  // Keep local like state in sync when selectedBlog or user changes
  useEffect(() => {
    setBlogLike(selectedBlog?.likes?.length || 0);
    setLiked(Boolean(selectedBlog?.likes?.includes(user?._id)));
  }, [selectedBlog, user]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const changeTimeFormat = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  };

  const likeOrDislikeHandler = async () => {
    if (!selectedBlog || !selectedBlog._id) {
      toast.error("Blog not available.");
      return;
    }
    if (!user?._id) {
      toast.error("You must be logged in to like posts.");
      return;
    }

    setLoadingLike(true);
    try {
      const action = liked ? "dislike" : "like";
      const url = `${API_BASE}/blog/${selectedBlog._id}/${action}`;

      const res = await axios.get(url, { withCredentials: true });

      if (res?.data?.success) {
        const updatedLikes = liked ? blogLike - 1 : blogLike + 1;
        setBlogLike(updatedLikes);
        setLiked(!liked);

        // Update blog in redux store immutably
        const updatedBlogData = blog.map((p) =>
          p._id === selectedBlog._id
            ? {
                ...p,
                likes: liked
                  ? (p.likes || []).filter((id) => id !== user._id)
                  : [...(p.likes || []), user._id],
              }
            : p
        );

        dispatch(setBlog(updatedBlogData));
        toast.success(res.data.message || `Post ${action}d`);
      } else {
        toast.error(res?.data?.message || "Action failed");
      }
    } catch (error) {
      console.error("Like/Dislike error:", error);
      const msg =
        error?.response?.data?.message || "Unable to perform the action.";
      toast.error(msg);
    } finally {
      setLoadingLike(false);
    }
  };

  const handleShare = (id) => {
    if (!id) return;
    // Build share URL using VITE_VLOG_VIEW route
    // ensure leading slash normalized
    const viewPath = VLOG_VIEW.startsWith("/") ? VLOG_VIEW : `/${VLOG_VIEW}`;
    const blogUrl = `${window.location.origin}${viewPath}/${id}`;

    if (navigator.share) {
      navigator
        .share({
          title: selectedBlog?.title || "Check out this blog",
          text: selectedBlog?.subtitle || "",
          url: blogUrl,
        })
        .then(() => console.log("Shared successfully"))
        .catch((err) => console.error("Error sharing:", err));
    } else if (navigator.clipboard) {
      navigator.clipboard
        .writeText(blogUrl)
        .then(() => toast.success("Blog link copied to clipboard!"))
        .catch((err) => {
          console.error("Clipboard copy failed:", err);
          toast.error("Failed to copy link");
        });
    } else {
      // final fallback: open a prompt with the URL for manual copy
      window.prompt("Copy this link:", blogUrl);
    }
  };

  // Render loading / not found states
  if (!selectedBlog) {
    return (
      <div className="pt-14">
        <div className="max-w-4xl mx-auto p-10 text-center">
          <h2 className="text-2xl font-semibold mb-4">Blog not found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            The blog you are looking for doesn't exist or hasn't been loaded
            yet. Try returning to the blog list.
          </p>
          <Link to={VLOG_VIEW}>
            <Button>Back to Blogs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-14">
      <div className="max-w-6xl mx-auto p-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link to={"/"}>
                <BreadcrumbLink>Home</BreadcrumbLink>
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <Link to={VLOG_VIEW}>
                <BreadcrumbLink>Blogs</BreadcrumbLink>
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{selectedBlog.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Blog Header */}
        <div className="my-8">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            {selectedBlog.title}
          </h1>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                {selectedBlog.author?.photoUrl ? (
                  <AvatarImage
                    src={selectedBlog.author.photoUrl}
                    alt={selectedBlog.author?.firstName || "Author"}
                  />
                ) : (
                  <AvatarFallback>
                    {selectedBlog.author?.firstName
                      ? selectedBlog.author.firstName.charAt(0)
                      : "A"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-medium">
                  {selectedBlog.author?.firstName}{" "}
                  {selectedBlog.author?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedBlog.author?.occupation}
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Published on {changeTimeFormat(selectedBlog.createdAt)} •{" "}
              {selectedBlog.readTime || "8 min"} read
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {selectedBlog?.thumbnail && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={selectedBlog.thumbnail}
              alt={selectedBlog.title}
              width={1000}
              height={500}
              className="w-full object-cover"
            />
            {selectedBlog.subtitle && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                {selectedBlog.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: selectedBlog.description || "" }}
        />

        <div className="mt-10">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {(selectedBlog.tags || []).length > 0 ? (
              selectedBlog.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))
            ) : (
              <>
                <Badge variant="secondary">Next.js</Badge>
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">Web Development</Badge>
              </>
            )}
          </div>

          {/* Engagement */}
          <div className="flex items-center justify-between border-y dark:border-gray-800 border-gray-300 py-4 mb-8">
            <div className="flex items-center space-x-4">
              <Button
                onClick={likeOrDislikeHandler}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                disabled={loadingLike}
              >
                {liked ? (
                  <FaHeart size={20} className="cursor-pointer text-red-600" />
                ) : (
                  <FaRegHeart
                    size={20}
                    className="cursor-pointer hover:text-gray-600"
                  />
                )}
                <span>{blogLike}</span>
              </Button>

              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{comment?.length || 0} Comments</span>
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleShare(selectedBlog._id)}
                variant="ghost"
                size="sm"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Comment Box */}
        <CommentBox selectedBlog={selectedBlog} />
      </div>
    </div>
  );
};

export default BlogView;
