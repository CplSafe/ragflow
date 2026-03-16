import { EmbedContainer } from '@/components/embed-container';
import { NextMessageInput } from '@/components/message-input/next';
import MessageItem from '@/components/message-item';
import PdfSheet from '@/components/pdf-drawer';
import { useClickDrawer } from '@/components/pdf-drawer/hooks';
import { useSyncThemeFromParams } from '@/components/theme-provider';
import { MessageType, SharedFrom } from '@/constants/chat';
import { useFetchFlowSSE } from '@/hooks/use-agent-request';
import {
  useFetchExternalChatInfo,
  useFetchNextConversationSSE,
} from '@/hooks/use-chat-request';
import i18n, { changeLanguageAsync } from '@/locales/config';
import { buildMessageUuidWithRole } from '@/utils/chat';
import { Loader2 } from 'lucide-react';
import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import { useSendButtonDisabled } from '../hooks/use-button-disabled';
import {
  useGetSharedChatSearchParams,
  useSendSharedMessage,
} from '../hooks/use-send-shared-message';
import { buildMessageItemReference } from '../utils';

// 加载状态提示组件
const LoadingIndicator = ({ sendLoading }: { sendLoading: boolean }) => {
  const [loadingText, setLoadingText] = useState('请稍后，正在分析您的问题...');

  useEffect(() => {
    if (!sendLoading) return;

    const timer1 = setTimeout(() => {
      setLoadingText('正在检索相关知识库...');
    }, 1500);

    return () => {
      clearTimeout(timer1);
    };
  }, [sendLoading]);

  if (!sendLoading) return null;

  return (
    <div className="flex items-center gap-2 p-4 text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      <span className="text-sm">{loadingText}</span>
    </div>
  );
};

const ChatContainer = () => {
  const {
    sharedId: conversationId,
    from,
    locale,
    theme,
    visibleAvatar,
  } = useGetSharedChatSearchParams();
  useSyncThemeFromParams(theme);
  const { visible, hideModal, documentId, selectedChunk, clickDocumentButton } =
    useClickDrawer();

  const {
    handlePressEnter,
    handleInputChange,
    value,
    sendLoading,
    derivedMessages,
    hasError,
    stopOutputMessage,
    scrollRef,
    messageContainerRef,
    removeAllMessagesExceptFirst,
  } = useSendSharedMessage();
  const sendDisabled = useSendButtonDisabled(value);
  const { data: chatInfo } = useFetchExternalChatInfo();

  const useFetchAvatar = useMemo(() => {
    return from === SharedFrom.Agent
      ? useFetchFlowSSE
      : useFetchNextConversationSSE;
  }, [from]);
  React.useEffect(() => {
    if (locale && i18n.language !== locale) {
      changeLanguageAsync(locale);
    }
  }, [locale, visibleAvatar]);

  const { data: avatarData } = useFetchAvatar();

  if (!conversationId) {
    return <div>empty</div>;
  }

  // 检查最后一条 AI 消息是否有内容
  const lastMessage = derivedMessages?.[derivedMessages.length - 1];
  const hasLastAssistantContent =
    lastMessage?.role === MessageType.Assistant &&
    lastMessage?.content &&
    lastMessage.content.length > 0;

  // 判断是否需要显示加载提示：
  // 条件：正在加载中，且最后一条 AI 消息没有内容
  const showLoadingIndicator = sendLoading && !hasLastAssistantContent;

  return (
    <>
      <EmbedContainer
        title={chatInfo.title}
        avatar={chatInfo.avatar}
        handleReset={removeAllMessagesExceptFirst}
      >
        <div className="flex flex-1 flex-col p-2.5 h-[90vh] m-3">
          <div
            className={
              'flex flex-1 flex-col overflow-auto scrollbar-auto m-auto w-full md:w-5/6'
            }
            ref={messageContainerRef}
          >
            <div>
              {derivedMessages?.map((message, i) => {
                return (
                  <MessageItem
                    visibleAvatar={visibleAvatar}
                    key={buildMessageUuidWithRole(message)}
                    avatarDialog={avatarData?.avatar}
                    item={message}
                    nickname="You"
                    reference={buildMessageItemReference(
                      {
                        message: derivedMessages,
                        reference: [],
                      },
                      message,
                    )}
                    loading={
                      message.role === MessageType.Assistant &&
                      sendLoading &&
                      derivedMessages?.length - 1 === i
                    }
                    index={i}
                    clickDocumentButton={clickDocumentButton}
                    showLikeButton
                    showLoudspeaker
                    showPrompt={false}
                    showAiDisclaimer
                    collapsible
                  ></MessageItem>
                );
              })}
              {/* 加载状态提示 - 只在AI还没有输出内容时显示 */}
              {showLoadingIndicator && (
                <LoadingIndicator sendLoading={sendLoading} />
              )}
            </div>
            <div ref={scrollRef} />
          </div>
          <div className="flex w-full justify-center md:mb-8">
            <div className="w-full md:w-5/6">
              <NextMessageInput
                isShared
                value={value}
                disabled={hasError}
                sendDisabled={sendDisabled}
                resize="vertical"
                conversationId={conversationId}
                onInputChange={handleInputChange}
                onPressEnter={handlePressEnter}
                sendLoading={sendLoading}
                uploadMethod="external_upload_and_parse"
                showUploadIcon={false}
                stopOutputMessage={stopOutputMessage}
                showReasoning={false}
                showInternet={chatInfo?.has_tavily_key}
              ></NextMessageInput>
            </div>
          </div>
        </div>
      </EmbedContainer>
      {visible && (
        <PdfSheet
          visible={visible}
          hideModal={hideModal}
          documentId={documentId}
          chunk={selectedChunk}
        ></PdfSheet>
      )}
    </>
  );
};

export default forwardRef(ChatContainer);
