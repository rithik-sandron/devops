import { BlogPosts } from "app/components/posts";

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        My Portfolio
      </h1>
      <p className="mb-4">
        {`Owl is a rogue archaeologist who discovered a portal beneath the Sahara
        in 1987 and hasn't aged a day since. Armed with a cursed compass and an
        encyclopedic knowledge of dead languages, he races shadowy organizations
        to recover artifacts that were never meant to be found. Nobody knows his
        real name. Nobody's ever seen him sleep. Some say he's already three
        steps ahead of whatever you're planning right now.`}
      </p>
      <div className="my-8">
        <BlogPosts />
      </div>
    </section>
  );
}
