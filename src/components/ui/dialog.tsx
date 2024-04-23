import * as R from "@radix-ui/react-dialog";
import { cn } from "~/lib/utils";
import { inter } from "~/pages/_app";

interface DefaultProps extends R.DialogProps {}
export default function Dialog(props: DefaultProps) {
  return <R.Root {...props}>{props.children}</R.Root>;
}

interface TriggerProps extends R.DialogTriggerProps {}
export function DialogTrigger({ children, ...props }: TriggerProps) {
  return <R.Trigger {...props}>{children}</R.Trigger>;
}

interface ContentProps extends R.DialogContentProps {
  closeHandler?: () => void;
  onCloseIconClick?: () => void;
  useOverlay?: boolean;
  centered?: boolean;
  animate?: boolean;
  hideClose?: boolean;
}

export function DialogContent({
  useOverlay = true,
  onCloseIconClick,
  closeHandler,
  title,
  children,
  className,
  animate = true,
  centered = true,
  hideClose = true,
  ...props
}: ContentProps) {
  const onCloseClick = () => closeHandler ?? null;
  const hasTitle = !!title;

  return (
    <R.Portal>


      <div
        className={cn(
          !centered && "p-6",
        )}>
        <R.Content
          className={cn(
            "z-[120] rounded-2xl border border-white-12  bg-[#242424] p-4 pt-5 shadow-2xl outline-0 w-[calc(100%-48px)] font-sans ", inter.variable,
            centered
              ? "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-[60%]"
              : "absolute",
            animate && !centered && "animate-dialog",

            className,
          )}
          onPointerDownOutside={closeHandler ? closeHandler : undefined}
          {...props}>
          <>
            {hasTitle ? (
              <div className="mb-2 flex items-center justify-between">
                <R.Title className=" max-w-[90%] select-none  ">
                  {title}
                </R.Title>
                {!hideClose && (
                  <DialogClose
                    asChild
                    onClick={onCloseIconClick || onCloseClick}
                    className="relative"
                  />
                )}
              </div>
            ) : (
              !hideClose && (
                <DialogClose
                  asChild
                  className="absolute right-3 top-3"
                  onClick={onCloseClick}
                />
              )
            )}
            {children}
          </>
        </R.Content>
      </div>
    </R.Portal>
  );
}

export function DialogClose({ className, onClick }: R.DialogCloseProps) {
  return (
    <R.Close
      onClick={onClick}
      className={cn(
        "pointer hover:bg-w08 ml-2 h-6 w-6 shrink-0 rounded p-0.5",
        className,
      )}>
        Exit
      {/* <XMarkIcon /> */}
    </R.Close>
  );
}
